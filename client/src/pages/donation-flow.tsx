import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, ArrowRight, Check, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import successIcon from "@assets/image_1756315503638.png";
import errorIcon from "@assets/image_1756315535596.png";
import Logo from "@/components/logo";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  CardNumberElement,
  useStripe,
  useElements,
  PaymentRequestButtonElement,
  PaymentElement,
} from "@stripe/react-stripe-js";
import { useStripeKeysStatus } from "@/hooks/useStripeKeys";
import { planDetails, planPrices } from "@/lib/stripe";

//TRECHO ADICIONADO
const isValidClientSecret = (s?: string) =>
  typeof s === "string" && s.includes("_secret_");

// Stripe setup
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY!);

interface DonationData {
  plan: string;
  amount: number;
  nome: string;
  telefone: string;
  telefone_numero: string; // Novo campo apenas para o número (sem DDI)
  sms_code: string;
  email: string;
  cardholderName?: string;
  payment?: string;
  impact_ready?: string;
  payment_success?: string;
  welcome_post_payment?: string;
  grito_selection?: string;
  payment_failed?: string;
}

interface PlanInfo {
  id: string;
  name: string;
  value: number;
  displayValue: string;
}

export default function DonationFlow() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  // ✅ Validação das chaves da Stripe
  const { hasKeys, isLoading: isCheckingStripe } = useStripeKeysStatus();

  // State management
  const [currentStep, setCurrentStep] = useState(0); // Start with impact journey message
  const [isLoading, setIsLoading] = useState(false);
  const [planInfo, setPlanInfo] = useState<PlanInfo | null>(null);
  const [showWelcome, setShowWelcome] = useState(false);
  const [animationKey, setAnimationKey] = useState(0); // For triggering animations
  const [clientSecret, setClientSecret] = useState<string>("");
  const [paymentCompleted, setPaymentCompleted] = useState(false);
  const [isPreparingPayment, setIsPreparingPayment] = useState(false);
  const [allowAutoAdvance, setAllowAutoAdvance] = useState(true);
  const [justNavigatedBack, setJustNavigatedBack] = useState(false);
  const [isSendingSMS, setIsSendingSMS] = useState(false);
  const [smsCodeInputs, setSmsCodeInputs] = useState(["", "", "", "", "", ""]);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [cardType, setCardType] = useState<"credit" | "debit">("credit");
  const [paymentWasSuccessful, setPaymentWasSuccessful] = useState(false);
  // Email do checkout é gerenciado internamente no PaymentStep para evitar re-renderização
  const [donationData, setDonationData] = useState<DonationData>({
    plan: "",
    amount: 0,
    nome: "",
    telefone: "",
    telefone_numero: "", // Novo campo para número apenas
    sms_code: "",
    email: "",
    grito_selection: "",
  });

  // TRECHO ADICIONADO:
  const goToStepByType = (type: string) => {
    const idx = steps.findIndex(s => s.type === type);
    if (idx >= 0) {
      setAnimationKey(prev => prev + 1);
      setCurrentStep(idx);
    } else {
      console.error(`Step type "${type}" não encontrado.`);
    }
  };
  
  // 🔍 DEBUG: Log quando currentStep muda
  useEffect(() => {
    console.log(`📍 [STEP CHANGE] currentStep mudou para: ${currentStep}`, new Error().stack?.split('\n').slice(1, 4));
  }, [currentStep]);

  // ✅ FUNÇÃO DE POLLING: Obter clientSecret quando subscription vier com PI null
  const pollForClientSecret = async (subscriptionId: string): Promise<string> => {
    const MAX_ATTEMPTS = 10;
    const INTERVAL_MS = 1000;

    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
      console.log(`🔄 [POLLING] Tentativa ${attempt}/${MAX_ATTEMPTS} - Buscando clientSecret para subscription ${subscriptionId}`);
      
      try {
        const response = await apiRequest(`/api/subscriptions/${subscriptionId}/client-secret`, {
          method: "GET",
        });

        if (response.clientSecret && isValidClientSecret(response.clientSecret)) {
          console.log(`✅ [POLLING] clientSecret obtido com sucesso na tentativa ${attempt}`);
          return response.clientSecret;
        }

        console.log(`⏳ [POLLING] clientSecret ainda null, aguardando ${INTERVAL_MS}ms...`);
        await new Promise(resolve => setTimeout(resolve, INTERVAL_MS));
      } catch (error) {
        console.error(`❌ [POLLING] Erro na tentativa ${attempt}:`, error);
        if (attempt === MAX_ATTEMPTS) {
          throw new Error("Falha ao obter clientSecret após múltiplas tentativas");
        }
        await new Promise(resolve => setTimeout(resolve, INTERVAL_MS));
      }
    }

    throw new Error("Timeout: clientSecret não disponível após 10 tentativas");
  };

  useEffect(() => {
    localStorage.removeItem("donation_flow_progress");
    localStorage.removeItem("termsAccepted");
  }, []);

  // Get plan info from URL
  const urlParams = new URLSearchParams(window.location.search);
  const planId = urlParams.get("plan");
  const periodicity = urlParams.get("periodicity");
  const customAmount = urlParams.get("amount");
  const stepParam = urlParams.get("step");

  useEffect(() => {
    // Allow dev access without plan parameter
    const isDevAccess = urlParams.get("dev_access") === "true";
    const isFromDevPanel = urlParams.get("origin") === "dev_panel";

    // Try to get plan from localStorage if not in URL
    const savedPlan = localStorage.getItem("selectedPlan");
    const effectivePlanId = planId || savedPlan;

    // ✅ CORREÇÃO: Não redirecionar se pagamento foi completado
    if (!effectivePlanId && !isDevAccess && !isFromDevPanel && !paymentCompleted && !paymentWasSuccessful) {
      console.log(
        `❌ [DONATION FLOW DEBUG] Redirecionando para /plans - nenhum plano encontrado`
      );
      setLocation("/plans");
      return;
    }

    // Set plan information
    let planData: PlanInfo;

    // For dev access without plan, use default
    if (!effectivePlanId && (isDevAccess || isFromDevPanel)) {
      planData = {
        id: "demo",
        name: "Demo (Dev Access)",
        value: 9.9,
        displayValue: "R$ 9,90",
      };
    } else if (effectivePlanId === "platinum") {
      const monthlyAmount = customAmount ? parseFloat(customAmount) : 50;
      
      // Obter periodicidade e calcular valor total do período
      const selectedPeriodicity = periodicity || localStorage.getItem('selectedPeriodicity') || 'mensal';
      
      // Multiplicadores por periodicidade
      const periodicityMultiplier: { [key: string]: number } = {
        'mensal': 1,
        'trimestral': 3,
        'semestral': 6,
        'anual': 12
      };
      
      const periodicityDisplay: { [key: string]: string } = {
        'mensal': '/mês',
        'trimestral': '/trimestre',
        'semestral': '/semestre',
        'anual': '/ano'
      };
      
      // Calcular valor total do período (valor mensal × multiplicador)
      const multiplier = periodicityMultiplier[selectedPeriodicity] || 1;
      const totalAmount = monthlyAmount * multiplier;
      
      planData = {
        id: "platinum",
        name: "Platinum",
        value: totalAmount, // Valor TOTAL do período
        displayValue: `R$ ${totalAmount.toFixed(2).replace(".", ",")}${periodicityDisplay[selectedPeriodicity] || '/mês'}`,
      };
    } else {
      // Use the centralized plan pricing structure from stripe.ts
      const effectivePeriodicity = periodicity || "mensal"; // Default to mensal
      const planDetail =
        planDetails[effectivePlanId as keyof typeof planDetails];
      const planPrice = planPrices[effectivePlanId as keyof typeof planPrices];

      if (planDetail && planPrice && (planPrice as any)[effectivePeriodicity]) {
        const periodicityData = (planPrice as any)[effectivePeriodicity];
        // Convert cents to reais for display
        const valueInReais = periodicityData.price / 100;
        planData = {
          id: effectivePlanId || "eco",
          name: planDetail.name,
          value: valueInReais,
          displayValue: periodicityData.display,
        };
      } else {
        // Fallback to eco mensal plan using stripe.ts data
        const fallbackPrice = planPrices.eco.mensal;
        planData = {
          id: "eco",
          name: "Eco",
          value: fallbackPrice.price / 100, // Convert cents to reais
          displayValue: fallbackPrice.display,
        };
      }
    }

    setPlanInfo(planData);
    setDonationData((prev) => ({
      ...prev,
      plan: effectivePlanId || planData.id,
      amount: planData.value,
    }));

    // Save periodicity to localStorage for API call
    if (periodicity) {
      localStorage.setItem("selectedPeriodicity", periodicity);
    }
  }, [planId, customAmount]);

  // Form steps configuration
  const steps = [
    {
      question: "Pronto para começar sua jornada de impacto?",
      placeholder: "",
      field: "impact_ready" as keyof DonationData,
      type: "impact",
      validation: () => true, // No validation needed for this step
    },
    {
      question: "Qual é o seu nome completo?",
      placeholder: "Digite seu nome e sobrenome",
      field: "nome" as keyof DonationData,
      type: "text",
      validation: (value: string) => {
        const words = value
          .trim()
          .split(" ")
          .filter((word) => word.length > 0);
        return words.length >= 2 && value.trim().length >= 5;
      },
    },
    {
      question: "Qual é o seu telefone?",
      placeholder: "(11) 99999-9999",
      field: "telefone" as keyof DonationData,
      type: "tel",
      validation: (value: string) => {
        // Validar usando o valor passado (telefone_numero formatado)
        const phoneNumber = (value || "").replace(/\D/g, "");
        return phoneNumber.length >= 10 && phoneNumber.length <= 11;
      },
    },
    {
      question: "Confirme Código",
      placeholder: "",
      field: "sms_code" as keyof DonationData,
      type: "sms_verification",
      validation: (value: string) =>
        value.length === 6 && /^\d{6}$/.test(value),
    },
    {
      question: "Pagamento",
      placeholder: "",
      field: "payment" as keyof DonationData,
      type: "payment",
      validation: () => true,
    },
    {
      question: "Resultado do Pagamento - Sucesso",
      placeholder: "",
      field: "payment_success" as keyof DonationData,
      type: "payment_success",
      validation: () => true,
    },
    {
      question: "Que bom ter você por aqui!",
      placeholder: "",
      field: "welcome_post_payment" as keyof DonationData,
      type: "welcome_post_payment",
      validation: () => true,
    },
    {
      question: "Agora me conta, qual é o seu Grito?",
      placeholder: "",
      field: "grito_selection" as keyof DonationData,
      type: "grito_selection",
      validation: (value: string) => value && value.trim().length > 0,
    },
    {
      question: "Resultado do Pagamento - Falha",
      placeholder: "",
      field: "payment_failed" as keyof DonationData,
      type: "payment_failed",
      validation: () => true,
    },
  ];

  // Handle step parameter from URL - after steps are defined
  useEffect(() => {
    if (stepParam && planInfo) {
      const stepNumber = parseInt(stepParam);
      if (stepNumber >= 0 && stepNumber < steps.length) {
        setCurrentStep(stepNumber);
      }
    }
  }, [stepParam, planInfo]);

  // Payment step is now integrated as a regular step (index 4)

  // ✅ CORREÇÃO AUTO-REFRESH: currentStepData otimizado sem console.logs excessivos
  const currentStepData = useMemo(() => {
    // Verificação de segurança: garantir que currentStep está no range válido
    if (currentStep < 0 || currentStep >= steps.length) {
      // Fallback para step 0 se currentStep está inválido
      return steps.length > 0 ? steps[0] : null;
    }

    return steps[currentStep];
  }, [currentStep, steps.length]); // Dependências otimizadas

  // 🔧 CORREÇÃO: Fallback adicional para casos extremos
  const safeCurrentStepData =
    currentStepData || (steps.length > 0 ? steps[0] : null);

  // Format phone number - now only for the number part (without DDI)
  const formatPhoneNumber = (value: string) => {
     const numbers = value.replace(/\D/g, "").slice(0, 11);

    if (numbers.length <= 2) {
      // Enquanto digita o DDD, não injeta parênteses
      return numbers;
    }
    if (numbers.length <= 6) {
      // DDD + começo do número, sem hífen ainda
      return `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`;
    }
    if (numbers.length === 10) {
      // fixo: (XX) XXXX-XXXX
      return `(${numbers.slice(0,2)}) ${numbers.slice(2,6)}-${numbers.slice(6)}`;
    }
    if (numbers.length === 11) {
      // celular: (XX) XXXXX-XXXX
      return `(${numbers.slice(0,2)}) ${numbers.slice(2,7)}-${numbers.slice(7)}`;
    }
    // entre 7 e 9 dígitos: aplica espaço, mas sem hífen
    return `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`;
  };

  // Function to combine DDI with number for SMS/backend compatibility
  const getFullPhoneForSMS = () => {
    // Verificar se telefone_numero existe e tem conteúdo
    const rawNumber =
      donationData.telefone_numero || donationData.telefone || "";
    const cleanNumber = rawNumber.replace(/\D/g, "");

    // Validação: deve ter pelo menos 10 dígitos (DDD + número)
    if (cleanNumber.length < 10) {
      console.error("Telefone inválido para SMS:", rawNumber);
      return ""; // Retorna vazio para forçar erro explícito
    }

    // Se já tem DDI (começar com 55), usar como está
    if (cleanNumber.startsWith("55") && cleanNumber.length >= 12) {
      return cleanNumber;
    }

    // Adicionar DDI 55 se não tiver
    return `55${cleanNumber}`;
  };

  // Legacy formatPhone function for backward compatibility
  const formatPhone = (value: string) => {
    if (value.startsWith("55")) {
      const numbers = value.replace(/\D/g, "").slice(2); // Remove DDI 55
      return formatPhoneNumber(numbers);
    }
    return formatPhoneNumber(value);
  };

  // ✅ CORREÇÃO AUTO-REFRESH: handleInputChange otimizado com useCallback
  const handleInputChange = useCallback(
    (value: string) => {
      if (!safeCurrentStepData) return;

      let formattedValue = value;

      if (safeCurrentStepData.field === "telefone") {
        formattedValue = formatPhoneNumber(value);

        setDonationData((prev) => ({
          ...prev,
          telefone_numero: formattedValue,
          telefone: `55${value.replace(/\D/g, "")}`,
        }));
      } else {
        setDonationData((prev) => ({
          ...prev,
          [safeCurrentStepData.field]: formattedValue,
        }));
      }

      if (justNavigatedBack) {
        setJustNavigatedBack(false);
      }
      setAllowAutoAdvance(true);
    },
    [safeCurrentStepData?.field, justNavigatedBack]
  );

  // ✅ CORREÇÃO AUTO-REFRESH: handleNext otimizado com useCallback
  const handleNext = useCallback(async () => {
    if (!safeCurrentStepData) return;

    // Skip validation for impact step
    if (safeCurrentStepData.type !== "impact") {
      let currentValue = donationData[safeCurrentStepData.field] as string;

      // Para campo telefone, usar o telefone_numero para validação
      if (safeCurrentStepData.field === "telefone") {
        currentValue = donationData.telefone_numero;
      }

      // Check terms acceptance for nome field - silently validate without showing error
      if (safeCurrentStepData.field === "nome" && !termsAccepted) {
        return;
      }

      // Only validate field content if terms are accepted (for nome field) or it's not nome field
      if (!safeCurrentStepData.validation(currentValue)) {
        let errorMessage = "Por favor, preencha este campo corretamente.";

        if (safeCurrentStepData.field === "nome") {
          errorMessage =
            "Por favor, digite seu nome completo (nome e sobrenome).";
        } else if (safeCurrentStepData.field === "telefone") {
          errorMessage =
            "Por favor, digite um telefone válido com pelo menos 10 dígitos.";
        } else if (safeCurrentStepData.field === "sms_code") {
          errorMessage =
            "Código SMS inválido. Verifique o código de 6 dígitos enviado para seu celular.";
        } else if (safeCurrentStepData.field === "email") {
          errorMessage = "Por favor, digite um e-mail válido.";
        }

        toast({
          title: "Campo obrigatório",
          description: errorMessage,
          variant: "destructive",
        });
        return;
      }
    }

    // Send SMS after phone step
    if (safeCurrentStepData.field === "telefone") {
      await sendSMSCode();
      return;
    }

    // After SMS verification step (index 3) - verify SMS code first, then prepare payment
    if (currentStep === 3) {
      await verifySMSCode();
      return;
    }

    // Move to next step
    setAnimationKey((prev) => prev + 1);
    setCurrentStep((prev) => prev + 1);
  }, [safeCurrentStepData, currentStep, donationData, termsAccepted, toast]);

  // Send SMS verification code
  const sendSMSCode = async () => {
    setIsSendingSMS(true);
    setIsLoading(true);

    try {
      const phone = getFullPhoneForSMS(); // Usar função que combina DDI + número

      // Validação antes de enviar
      if (!phone || phone.length < 12) {
        throw new Error(
          "Número de telefone inválido. Digite um número válido com DDD."
        );
      }

      const response = await fetch("/api/auth/send-sms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone }),
      });

      // Parse response
      let result;
      try {
        result = await response.json();
      } catch (jsonError) {
        // If not JSON, create a generic error
        result = {
          success: false,
          error: "Erro de comunicação com o servidor",
        };
      }

      // Check if response is ok OR if it's a development fallback
      if (response.ok || result.success) {
        // Show success message - even for development fallback
        const description = result.devCode
          ? `Código de desenvolvimento: ${result.devCode}`
          : "Verifique suas mensagens de texto.";

        toast({
          title: "Código enviado!",
          description,
        });

        // Move to SMS verification step
        setAnimationKey((prev) => prev + 1);
        setCurrentStep((prev) => prev + 1);
      } else {
        // Handle specific error cases
        let message = result.error || "Erro ao enviar SMS";

        // Caso o servidor retorne status 409 (Conflito), significa que o telefone já está cadastrado.
        if (response.status === 409) {
          message = "Telefone já possui cadastro";
        }

        throw new Error(message);
      }
    } catch (error: any) {
      toast({
        title: "Erro",
        description:
          error.message || "Erro ao enviar código SMS. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsSendingSMS(false);
      setIsLoading(false);
    }
  };

  // Handle SMS code input
  const handleSMSCodeChange = (index: number, value: string) => {
    if (value.length > 1) return; // Only single digit

    const newInputs = [...smsCodeInputs];
    newInputs[index] = value;
    setSmsCodeInputs(newInputs);

    // Update donation data
    const fullCode = newInputs.join("");
    setDonationData((prev) => ({
      ...prev,
      sms_code: fullCode,
    }));

    // Auto-focus next input
    if (value && index < 5) {
      const nextInput = document.getElementById(`sms-input-${index + 1}`);
      nextInput?.focus();
    }

    // Auto-focus only - no validation until button click
  };

  // Handle backspace/delete behavior for SMS inputs
  const handleSMSKeyDown = (
    index: number,
    e: React.KeyboardEvent<HTMLInputElement>
  ) => {
    if (e.key === "Backspace") {
      const currentValue = smsCodeInputs[index];

      // If current field is empty and we're not on the first field
      if (!currentValue && index > 0) {
        // Move to previous field and clear it
        const newInputs = [...smsCodeInputs];
        newInputs[index - 1] = "";
        setSmsCodeInputs(newInputs);

        // Update donation data
        const fullCode = newInputs.join("");
        setDonationData((prev) => ({
          ...prev,
          sms_code: fullCode,
        }));

        // Focus previous input
        const prevInput = document.getElementById(`sms-input-${index - 1}`);
        prevInput?.focus();
      }
    }
  };

  // Get border color for SMS input
  const getSMSInputBorderColor = (index: number, digit: string) => {
    const activeElement = document.activeElement;
    const isThisFieldFocused = activeElement?.id === `sms-input-${index}`;

    if (digit || isThisFieldFocused) {
      return "#FFD700"; // Yellow when filled or focused
    }
    return "#E5E5E5"; // Gray when empty and not focused
  };

  // ✅ NOVA FUNÇÃO: Criar payment intent para novos usuários

  // TRECHO ALTERADO
  const createPaymentForNewUser = async (phone: string) => {
    setIsLoading(true);
    try {
      console.log(
        `✅ [NEW USER PAYMENT] Criando pagamento para novo usuário: ${phone}`
      );

      // Obter periodicidade escolhida pelo usuário
      const selectedPeriodicity = localStorage.getItem('selectedPeriodicity') || 'mensal';
      
      const referralCode = localStorage.getItem("referralCode") || "";
      
      const result = await apiRequest("/api/donation/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nome: donationData.nome,
          telefone: phone.replace(/\D/g, ""),
          email: donationData.email || "",
          plano: donationData.plan,
          valor:
            donationData.plan === "platinum"
              ? donationData.amount
              : donationData.amount,
          periodicity: selectedPeriodicity,
          referralCode: referralCode || undefined,
        }),
      });

      // ✅ NOVO FLUXO: Processar resposta subscription-first
      let finalClientSecret = result.clientSecret;

      // Se clientSecret vier null, fazer polling
      if (!isValidClientSecret(finalClientSecret) && result.subscriptionId) {
        console.log(`⏳ [NEW USER PAYMENT] clientSecret null, iniciando polling para subscription ${result.subscriptionId}`);
        finalClientSecret = await pollForClientSecret(result.subscriptionId);
      }

      // Validar clientSecret final
      if (!isValidClientSecret(finalClientSecret)) {
        console.error("❌ clientSecret inválido:", finalClientSecret);
        throw new Error("Falha ao criar pagamento (clientSecret inválido).");
      }

      // Salvar dados locais para continuidade do fluxo
      setClientSecret(finalClientSecret);
      
      // Salvar subscriptionId e secretType
      if (result.subscriptionId) {
        localStorage.setItem("subscriptionId", result.subscriptionId);
        console.log('✅ [NEW USER PAYMENT] Subscription ID salvo:', result.subscriptionId);
      }
      
      if (result.secretType) {
        localStorage.setItem("secretType", result.secretType);
        console.log('✅ [NEW USER PAYMENT] Secret Type salvo:', result.secretType);
      }
      
      // Salvar stripeCustomerId para atualização de email antes do pagamento
      const customerId = result.stripeCustomerId || result.customerId;
      if (customerId) {
        localStorage.setItem("stripeCustomerId", customerId);
        console.log('✅ [NEW USER PAYMENT] Stripe Customer ID salvo:', customerId);
      }

      localStorage.setItem("selectedPlan", donationData.plan);

      if (result.userId)
        localStorage.setItem("donationUserId", String(result.userId));
      if (result.doadorId)
        localStorage.setItem("donationId", String(result.doadorId));

      // Também guardamos dados úteis da sessão
      if (result.userId) localStorage.setItem("userId", String(result.userId));
      localStorage.setItem("userName", donationData.nome);
      localStorage.setItem("userPhone", phone);
      localStorage.setItem("userPlan", donationData.plan);

      setTimeout(() => {
        setAnimationKey((k) => k + 1);
        setCurrentStep(4); // passo de pagamento
      }, 500);
    } catch (error: any) {
      toast({
        title: "Erro",
        description:
          error?.message || "Erro ao preparar pagamento. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Check for existing subscription before showing payment screen
  const checkExistingSubscription = async (phone: string) => {
    setIsLoading(true);
    try {
      // 🔧 CORREÇÃO: Usuário já foi verificado via SMS no sistema anterior
      console.log("🔍 [DONATION FLOW] Obtendo usuário do localStorage...");

      // Obter userId do localStorage (já foi salvo pelo sistema SMS)
      const userId = localStorage.getItem("userId");
      if (!userId) {
        throw new Error("Usuário não encontrado. Faça login novamente.");
      }

      console.log(
        `✅ [DONATION FLOW] Criando pagamento para telefone: ${phone}`
      );

      // Obter periodicidade escolhida pelo usuário
      const selectedPeriodicity = localStorage.getItem('selectedPeriodicity') || 'mensal';

      const referralCode = localStorage.getItem("referralCode") || "";
      
      // 🎯 Usar rota existente create-for-new-user
      const result = await apiRequest("/api/payments/create-for-new-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: phone,
          nome: donationData.nome,
          email: donationData.email || "",
          plan: donationData.plan,
          amount:
            donationData.plan === "platinum"
              ? donationData.amount * 100
              : undefined,
          periodicity: selectedPeriodicity,
          referralCode: referralCode || undefined,
        }),
      });

      if (result.success) {
        // Save user data to localStorage using the response from create-for-new-user
        localStorage.setItem("donationUserId", result.userId.toString());
        localStorage.setItem("selectedPlan", donationData.plan);
        localStorage.setItem("userId", result.userId.toString());
        localStorage.setItem("userName", donationData.nome);
        localStorage.setItem("userPhone", phone);
        localStorage.setItem("userPlan", donationData.plan);
        
        // Salvar stripeCustomerId para atualização de email antes do pagamento
        const existingCustomerId = result.stripeCustomerId || result.customerId;
        if (existingCustomerId) {
          localStorage.setItem("stripeCustomerId", existingCustomerId);
          console.log('✅ [EXISTING USER PAYMENT] Stripe Customer ID salvo:', existingCustomerId);
        }

        // Handle different subscription statuses
        if (result.status === "has_active") {
          // User already has active subscription - skip to success
          setPaymentWasSuccessful(true);
          setPaymentCompleted(true);

          // Configure user session for existing donor access
          localStorage.setItem("isVerified", "true");
          localStorage.setItem("userPapel", "doador");
          localStorage.setItem("hasActiveSubscription", "true");
          localStorage.setItem("firstTimeAccess", "false"); // Not first time since they have active subscription

          toast({
            title: "Bem-vindo de volta!",
            description: "Você já tem uma assinatura ativa.",
            duration: 2000,
          });

          // Go directly to payment success step
          setTimeout(() => {
            setAnimationKey((prev) => prev + 1);
            setCurrentStep(5); // payment_success step
          }, 1000);
        } else if (
          result.status === "incomplete" ||
          result.status === "created"
        ) {
          // User needs to complete payment - use provided clientSecret
          if (result.paymentIntentId) {
            localStorage.setItem("paymentIntentId", result.paymentIntentId);
          }
          // TRECHO ADICIONADO
          if (!isValidClientSecret(result?.clientSecret)) {
            throw new Error(
              "Falha ao recuperar pagamento (clientSecret inválido)."
            );
          }

          setClientSecret(result.clientSecret);

          toast({
            title: "Vamos finalizar seu pagamento!",
            description: "Só mais um passo para completar sua doação.",
          });

          // Move to payment step
          setTimeout(() => {
            setAnimationKey((prev) => prev + 1);
            setCurrentStep(4); // payment step
          }, 1000);
        } else {
          throw new Error("Status de pagamento não reconhecido");
        }
      } else {
        throw new Error(result.message || "Erro ao verificar pagamento");
      }
    } catch (error: any) {
      toast({
        title: "Erro",
        description:
          error.message || "Erro ao verificar pagamento. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Verify SMS code
  // TRECHO ALTERADO
  const verifySMSCode = async () => {
    setIsLoading(true);

    try {
      const phone = getFullPhoneForSMS(); // DDI + número

      if (!phone || phone.length < 12) {
        throw new Error(
          "Número de telefone inválido. Digite um número válido com DDD."
        );
      }

      const response = await fetch("/api/auth/verify-sms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone,
          code: donationData.sms_code,
        }),
      });

      const result = await response.json();

      if (!response.ok || result?.success === false) {
        throw new Error(result?.error || "Código SMS inválido");
      }

      // SMS verificado - mas NÃO salvamos isVerified ainda!
      // isVerified só será salvo APÓS o pagamento ser confirmado
      // Isso evita que a pessoa fique "presa" na tela de assinatura pausada
      // se sair antes de completar o pagamento

      // Normalizações que o backend pode devolver
      const normalizedPhone =
        result?.canonicalPhone ||
        result?.normalizedPhone ||
        result?.phone ||
        phone;

      // 🚪 1) Usuário existente
      if (result?.user?.id) {
        localStorage.setItem("userId", String(result.user.id));
        localStorage.setItem("userName", result.user.nome || "");
        localStorage.setItem(
          "userPhone",
          result.user.telefone || normalizedPhone
        );
        localStorage.setItem("userEmail", result.user.email || "");
 
        await checkExistingSubscription(
           result.user.telefone || normalizedPhone
        ); // isto seta o clientSecret e faz setCurrentStep(4)
      }
      // 🆕 2) Usuário ainda não existe, mas o SMS foi verificado
      else if (result?.success === true) {
        const normalizedPhone =
          result?.canonicalPhone ||
          result?.normalizedPhone ||
          result?.phone ||
          phone;

        // salvas temporárias (se utilizadas depois)
        localStorage.setItem("tempUserPhone", normalizedPhone);
        localStorage.setItem("tempUserName", donationData.nome || "");
        localStorage.setItem("tempUserEmail", donationData.email || "");
        localStorage.setItem("phoneVerified", "true");

        console.log(
          `✅ [DONATION FLOW] SMS verificado - usuário será criado após pagamento: ${normalizedPhone}`
        );

        // 👉 navega AGORA para o passo de pagamento
        setAnimationKey((k) => k + 1);
        //setCurrentStep(4);

        // cria/recupera PaymentIntent (clientSecret) — PaymentStep mostra "Preparando pagamento…" até chegar
        await createPaymentForNewUser(normalizedPhone);
      }
      // 🔒 3) Fallback (não deveria cair aqui)
      else {
        throw new Error("Não foi possível validar o SMS. Tente novamente.");
      }
    } catch (error: any) {
      toast({
        title: "Erro",
        description:
          error?.message ||
          "Código SMS inválido. Verifique o código enviado para seu celular.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Resend SMS code
  const resendSMSCode = async () => {
    setIsSendingSMS(true);
    setIsLoading(true);

    try {
      // Clear existing code inputs
      setSmsCodeInputs(["", "", "", "", "", ""]);
      setDonationData((prev) => ({ ...prev, sms_code: "" }));

      const phone = getFullPhoneForSMS(); // Usar função que combina DDI + número

      // Validação antes de reenviar
      if (!phone || phone.length < 12) {
        throw new Error(
          "Número de telefone inválido. Digite um número válido com DDD."
        );
      }

      const response = await fetch("/api/auth/send-sms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone }),
      });

      // Parse response
      let result;
      try {
        result = await response.json();
      } catch (jsonError) {
        result = {
          success: false,
          error: "Erro de comunicação com o servidor",
        };
      }

      if (response.ok || result.success) {
        const description = result.devCode
          ? `Código de desenvolvimento: ${result.devCode}`
          : "Verifique suas mensagens de texto.";

        toast({
          title: "Código reenviado!",
          description,
        });

        // Focus back to first input
        setTimeout(() => {
          const firstInput = document.getElementById("sms-input-0");
          firstInput?.focus();
        }, 100);
      } else {
        throw new Error(result.error || "Erro ao reenviar SMS");
      }
    } catch (error: any) {
      toast({
        title: "Erro",
        description:
          error.message || "Erro ao reenviar código SMS. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsSendingSMS(false);
      setIsLoading(false);
    }
  };

  // Mask phone number for SMS display
  const maskPhoneNumber = (phone: string) => {
    const cleaned = phone.replace(/\D/g, "");
    if (cleaned.length >= 10) {
      return `(${cleaned.substr(0, 2)}) ${cleaned.charAt(2)}****-****`;
    }
    return phone;
  };

  // Update email after payment is complete
  // ✅ VERSÃO CORRIGIDA
  const updateEmailAndComplete = async () => {
    setIsLoading(true);

    try {
      // 1) Preferir sempre o userId real salvo no fluxo de login/SMS
      const storedUserId = localStorage.getItem("userId");
      // 2) Manter donationUserId só como fallback pra legado (se por acaso for igual)
      const fallbackDonationUserId = localStorage.getItem("donationUserId");

      const idToUse = storedUserId || fallbackDonationUserId;

      if (!idToUse) {
        console.warn(
          "[updateEmailAndComplete] Nenhum userId encontrado no localStorage. Email será salvo só localmente."
        );
      } else if (!donationData.email) {
        console.warn(
          "[updateEmailAndComplete] Email vazio ao tentar atualizar. Abortando chamada à API."
        );
      } else {
        // Chamar sua rota de backend para atualizar o email do USUÁRIO
        await apiRequest("/api/user/update-email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: Number(idToUse),
            email: donationData.email.trim(),
          }),
        });
      }

      // Salvar email localmente para uso no app
      if (donationData.email) {
        localStorage.setItem("userEmail", donationData.email.trim());
      }

      toast({
        title: "Cadastro concluído!",
        description: "Bem-vindo ao Clube do Grito!",
        duration: 3000,
      });

      // Redirecionar para o painel do doador
      setTimeout(() => {
        setLocation("/tdoador");
      }, 2000);
    } catch (error: any) {
      console.error("[updateEmailAndComplete] erro:", error);

      toast({
        title: "Erro",
        description:
          error?.message ||
          "Erro ao finalizar cadastro. Redirecionando mesmo assim.",
        variant: "destructive",
      });

      // Mesmo com erro, não travar o usuário
      setTimeout(() => {
        setLocation("/tdoador");
      }, 2000);
    } finally {
      setIsLoading(false);
    }
  };

  const preparePayment = async () => {
    setIsLoading(true);
    setIsPreparingPayment(true);
    try {
      const referralCode = localStorage.getItem("referralCode") || "";
      
      // Create donation and payment intent
      const result = await apiRequest("/api/donation/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nome: donationData.nome,
          telefone: donationData.telefone.replace(/\D/g, ""),
          email: donationData.email || "",
          plano: donationData.plan,
          valor: donationData.amount,
          periodicity:
            periodicity ||
            localStorage.getItem("selectedPeriodicity") ||
            "mensal",
          referralCode: referralCode || undefined,
        }),
      });

      if (result.success) {
        // ✅ NOVO FLUXO: Processar resposta subscription-first
        let finalClientSecret = result.clientSecret;

        // Se clientSecret vier null, fazer polling
        if (!isValidClientSecret(finalClientSecret) && result.subscriptionId) {
          console.log(`⏳ [PREPARE PAYMENT] clientSecret null, iniciando polling para subscription ${result.subscriptionId}`);
          finalClientSecret = await pollForClientSecret(result.subscriptionId);
        }

        // Validar clientSecret final
        if (!isValidClientSecret(finalClientSecret)) {
          throw new Error(
            "Falha ao preparar pagamento (clientSecret inválido)."
          );
        }

        // Save to localStorage for payment flow
        localStorage.setItem("donationUserId", result.userId.toString());
        localStorage.setItem("donationId", result.doadorId?.toString() || "");
        localStorage.setItem("selectedPlan", donationData.plan);
        
        // Salvar subscriptionId e secretType
        if (result.subscriptionId) {
          localStorage.setItem("subscriptionId", result.subscriptionId);
          console.log('✅ [PREPARE PAYMENT] Subscription ID salvo:', result.subscriptionId);
        }
        
        if (result.secretType) {
          localStorage.setItem("secretType", result.secretType);
          console.log('✅ [PREPARE PAYMENT] Secret Type salvo:', result.secretType);
        }

        // Save user data to localStorage for future login
        console.log(
          "🔄 DONATION-FLOW saving userId:",
          result.userId.toString()
        );
        localStorage.setItem("userId", result.userId.toString());
        localStorage.setItem("userName", donationData.nome);
        localStorage.setItem("userPhone", donationData.telefone);
        localStorage.setItem("userPlan", donationData.plan);

        setClientSecret(finalClientSecret);

        // Payment preparation complete - let handleNext advance normally
        setIsPreparingPayment(false);

        // Move to payment step
        setAnimationKey((prev) => prev + 1);
        setCurrentStep((prev) => prev + 1);
      } else {
        throw new Error(result.message || "Erro ao preparar pagamento");
      }
    } catch (error: any) {
      toast({
        title: "Erro",
        description:
          error.message || "Erro ao preparar pagamento. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      setIsPreparingPayment(false);
    }
  };

  // Handle previous step
  const handlePrevious = () => {
    if (currentStep > 0) {
      // Mark that we just navigated back to prevent auto-advance
      setJustNavigatedBack(true);
      setAllowAutoAdvance(false);
      setAnimationKey((prev) => prev + 1);

      setCurrentStep((prev) => prev - 1);
    } else {
      // When in first step (impact), go back to plans
      setLocation("/plans");
    }
  };

  // Payment component integrated into TypeForm
  const PaymentStep = () => {
    const stripe = useStripe();
    const elements = useElements();
    const [isProcessing, setIsProcessing] = useState(false);
    const [paymentRequest, setPaymentRequest] = useState<any>(null);
    const [showAppleGooglePay, setShowAppleGooglePay] = useState(false);
    const [resumoExpanded, setResumoExpanded] = useState(false);
    const [elementsReady, setElementsReady] = useState(false);
    
    // Estado LOCAL para o email - evita re-renderização do componente pai
    const [localEmail, setLocalEmail] = useState(() => {
      // Inicializa com email do localStorage ou estado pai
      return localStorage.getItem('userEmail') || donationData.email || '';
    });
    const localEmailRef = useRef(localEmail);
    
    // Atualiza a ref quando o email muda (para uso nos handlers)
    useEffect(() => {
      localEmailRef.current = localEmail;
    }, [localEmail]);

    // Wait for Stripe to be fully ready
    useEffect(() => {
      if (stripe && elements) {
        setElementsReady(true);
      }
    }, [stripe, elements]);

    // ✅ CORREÇÃO AUTO-REFRESH: useEffect otimizado com dependências estáveis
    const stablePlanInfo = useMemo(
      () => ({
        name: planInfo?.name,
        value: planInfo?.value,
      }),
      [planInfo?.name, planInfo?.value]
    );

    useEffect(() => {
      if (!stripe || !stablePlanInfo.name || !clientSecret) return;

      let pr: any = null;
      let paymentMethodHandler: any = null;

      try {
        pr = stripe.paymentRequest({
          country: "BR",
          currency: "brl",
          total: {
            label: `Clube do Grito - ${stablePlanInfo.name}`,
            amount: Math.round((stablePlanInfo.value || 0) * 100),
          },
          requestPayerName: true,
          requestPayerEmail: true,
          displayItems: [
            {
              label: `${stablePlanInfo.name} - Assinatura Mensal`,
              amount: Math.round((stablePlanInfo.value || 0) * 100),
            },
          ],
        });

        // Check if Payment Request is available (Apple Pay/Google Pay) - executado apenas uma vez
        pr.canMakePayment()
          .then((result: any) => {
            if (result) {
              setPaymentRequest(pr);
              setShowAppleGooglePay(true);
            }
          })
          .catch(() => {
            // Silently ignore payment request errors
          });

        // Handle payment method selection (Apple Pay / Google Pay)
        paymentMethodHandler = async (ev: any) => {
          setIsProcessing(true);
          try {
            const secretType = localStorage.getItem('secretType');
            const subscriptionId = localStorage.getItem('subscriptionId');
            
            // Capturar email do Apple Pay / Google Pay
            const payerEmail = ev.payerEmail || ev.paymentMethod?.billing_details?.email || localEmailRef.current;
            console.log('🍎 [APPLE/GOOGLE PAY] Email capturado:', payerEmail);
            
            // Salvar email no localStorage
            if (payerEmail) {
              localStorage.setItem('userEmail', payerEmail);
              setLocalEmail(payerEmail);
            }
            
            console.log('🍎 [APPLE/GOOGLE PAY] Iniciando confirmação...', { secretType, hasPaymentMethod: !!ev.paymentMethod.id });
            
            if (secretType === 'setup') {
              console.log('🔧 [APPLE/GOOGLE PAY] Fluxo SetupIntent...');
              const { error: setupError, setupIntent } = await stripe.confirmCardSetup(clientSecret, {
                payment_method: ev.paymentMethod.id,
              });

              if (setupError) {
                console.error('❌ [APPLE/GOOGLE PAY] SetupIntent Error:', setupError);
                ev.complete("fail");
                throw new Error(setupError.message);
              }

              console.log('✅ [APPLE/GOOGLE PAY] SetupIntent confirmado:', setupIntent?.status);
              
              if (setupIntent?.status === 'succeeded' && subscriptionId) {
                console.log('💳 [APPLE/GOOGLE PAY] Pagando invoice com email:', payerEmail);
                const payResponse = await fetch(`/api/subscriptions/${subscriptionId}/pay`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ 
                    paymentMethodId: setupIntent.payment_method,
                    email: payerEmail || localEmailRef.current || null
                  })
                });

                if (!payResponse.ok) {
                  const errData = await payResponse.json().catch(() => ({}));
                  throw new Error(errData.error || 'Falha ao processar pagamento');
                }

                const payData = await payResponse.json();
                console.log('✅ [APPLE/GOOGLE PAY] Invoice paga:', payData);
              }

              ev.complete("success");
            } else {
              console.log('💳 [APPLE/GOOGLE PAY] Fluxo PaymentIntent...');
              const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
                payment_method: ev.paymentMethod.id,
              });

              if (error) {
                console.error('❌ [APPLE/GOOGLE PAY] PaymentIntent Error:', error);
                ev.complete("fail");
                throw new Error(error.message);
              }

              console.log('✅ [APPLE/GOOGLE PAY] PaymentIntent confirmado:', paymentIntent?.status);
              ev.complete("success");

              try {
                await fetch("/api/donation/confirm", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    paymentIntentId: paymentIntent?.id,
                    status: paymentIntent?.status,
                    email: payerEmail || localEmailRef.current || null,
                  }),
                });
              } catch (e) {
                console.error("❌ Erro ao confirmar pagamento:", e);
              }
            }

            setPaymentCompleted(true);
            setPaymentWasSuccessful(true);
            localStorage.setItem("isVerified", "true");
            localStorage.setItem("userPapel", "doador");
            localStorage.setItem("hasActiveSubscription", "true");
            localStorage.setItem("firstTimeAccess", "true");
            localStorage.setItem("hasDoadorRole", "true");
            sessionStorage.setItem("justCompletedDonation", "true");
            setAnimationKey((prev) => prev + 1);
            setCurrentStep(5);
            
            toast({
              title: "Pagamento Confirmado!",
              description: "Agora vamos finalizar seu cadastro.",
              duration: 2000,
            });
          } catch (error: any) {
            console.error('❌ [APPLE/GOOGLE PAY] Erro geral:', error);
            ev.complete("fail");
            toast({
              title: "Erro no pagamento",
              description: error.message || "Houve um erro ao processar o pagamento.",
              variant: "destructive",
            });
            setPaymentWasSuccessful(false);
            setAnimationKey((prev) => prev + 1);
            setCurrentStep(8);
          } finally {
            setIsProcessing(false);
          }
        };

        pr.on("paymentmethod", paymentMethodHandler);
      } catch (error) {
        console.warn("Error initializing Payment Request:", error);
      }

      // Cleanup otimizado
      return () => {
        try {
          if (pr && paymentMethodHandler) {
            pr.off("paymentmethod", paymentMethodHandler);
          }
        } catch (error) {
          // Silent cleanup
        }
      };
    }, [stripe, stablePlanInfo.name, stablePlanInfo.value, clientSecret]); // Dependências otimizadas

    const handlePaymentElement = async () => {
      console.log('🚀 [PAYMENT ELEMENT] Iniciando handlePaymentElement...', {
        hasStripe: !!stripe,
        hasElements: !!elements,
        hasClientSecret: !!clientSecret,
        clientSecretPrefix: clientSecret?.substring(0, 20) + '...',
      });
      
      if (!stripe || !elements || !clientSecret) {
        console.error('❌ [PAYMENT ELEMENT] Faltando dependências:', { stripe: !!stripe, elements: !!elements, clientSecret: !!clientSecret });
        toast({
          title: "Erro",
          description: "Sistema de pagamento não carregado. Tente novamente.",
          variant: "destructive",
        });
        return;
      }

      setIsProcessing(true);

      try {
        // Recuperar secretType do localStorage
        const secretType = localStorage.getItem('secretType');
        const subscriptionId = localStorage.getItem('subscriptionId');
        console.log('🔍 [PAYMENT] Estado inicial:', { secretType, subscriptionId, clientSecretPrefix: clientSecret?.substring(0, 25) });
        
        // Fluxo diferente para PaymentIntent vs SetupIntent
        if (secretType === 'setup') {
          // FLUXO SETUP: Coletar cartão primeiro, depois pagar invoice
          console.log('🔧 [PAYMENT] Fluxo SetupIntent - coletando cartão...');
          
          // Recuperar email para billing_details (obrigatório quando usamos email: "never" no PaymentElement)
          const emailForBilling = localEmailRef.current || localStorage.getItem('userEmail') || 'doador@clubedogrito.com';
          console.log('📧 [SETUP] Email para billing_details:', emailForBilling);
          
          // Atualizar email do cliente no Stripe ANTES de confirmar (para garantir que o email esteja correto)
          const stripeCustomerId = localStorage.getItem('stripeCustomerId');
          if (stripeCustomerId && emailForBilling && emailForBilling !== 'doador@clubedogrito.com') {
            try {
              console.log('📧 [SETUP] Atualizando email do cliente no Stripe antes de confirmar...');
              const updateResp = await fetch('/api/stripe/update-customer-email', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  stripeCustomerId,
                  email: emailForBilling,
                }),
              });
              if (updateResp.ok) {
                console.log('✅ [SETUP] Email do cliente atualizado no Stripe');
              } else {
                console.warn('⚠️ [SETUP] Falha ao atualizar email no Stripe:', await updateResp.text());
              }
            } catch (err) {
              console.warn('⚠️ [SETUP] Erro ao atualizar email no Stripe:', err);
            }
          }
          
          const { error, setupIntent } = await stripe.confirmSetup({
            elements,
            confirmParams: {
              payment_method_data: {
                billing_details: {
                  email: emailForBilling,
                },
              },
            },
            redirect: "if_required",
          });

          if (error) {
            console.error("❌ [SETUP] Erro ao confirmar setup:", error);
            setPaymentWasSuccessful(false);
            setAnimationKey((prev) => prev + 1);
            setCurrentStep(8); // payment_failed step
            return;
          }

          if (setupIntent?.status === 'succeeded') {
            console.log('✅ [SETUP] Cartão salvo, agora pagando invoice...');
            
            // Pegar subscription ID do localStorage
            const subscriptionId = localStorage.getItem('subscriptionId');
            
            if (!subscriptionId) {
              console.error('❌ [SETUP] Subscription ID não encontrado no localStorage. Keys disponíveis:', Object.keys(localStorage));
              throw new Error('Subscription ID não encontrado');
            }
            
            console.log('🔍 [SETUP] Usando subscriptionId:', subscriptionId);
            
            // Chamar endpoint para pagar invoice
            const payResponse = await fetch(`/api/subscriptions/${subscriptionId}/pay`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                paymentMethodId: setupIntent.payment_method,
                email: localEmailRef.current || null
              })
            });

            if (!payResponse.ok) {
              throw new Error('Falha ao processar pagamento após setup');
            }

            const payData = await payResponse.json();
            console.log('✅ [SETUP] Invoice paga com sucesso:', payData);
            
            // Payment successful
            setPaymentCompleted(true);
            setPaymentWasSuccessful(true);

            // Salvar e-mail no localStorage
            if (localEmailRef.current) {
              localStorage.setItem("userEmail", localEmailRef.current);
            }

            // Configure user session
            localStorage.setItem("isVerified", "true");
            localStorage.setItem("userPapel", "doador");
            localStorage.setItem("hasActiveSubscription", "true");
            localStorage.setItem("firstTimeAccess", "true");
            localStorage.setItem("hasDoadorRole", "true");
            sessionStorage.setItem("justCompletedDonation", "true");

            // Go to success screen
            setAnimationKey((prev) => prev + 1);
            setCurrentStep(5); // payment_success step
          } else {
            console.error('❌ [SETUP] Setup failed, status:', setupIntent?.status);
            setPaymentWasSuccessful(false);
            setAnimationKey((prev) => prev + 1);
            setCurrentStep(8); // payment_failed step
          }
        } else {
          // FLUXO PAYMENT: Pagamento direto (original)
          console.log('💳 [PAYMENT] Fluxo PaymentIntent - confirmando pagamento...');
          
          // Recuperar email para billing_details (obrigatório quando usamos email: "never" no PaymentElement)
          const emailForBilling = localEmailRef.current || localStorage.getItem('userEmail') || 'doador@clubedogrito.com';
          console.log('📧 [PAYMENT] Email para billing_details:', emailForBilling);
          
          // Atualizar email do cliente no Stripe ANTES de confirmar (para garantir que o email esteja correto)
          const stripeCustomerId = localStorage.getItem('stripeCustomerId');
          if (stripeCustomerId && emailForBilling && emailForBilling !== 'doador@clubedogrito.com') {
            try {
              console.log('📧 [PAYMENT] Atualizando email do cliente no Stripe antes de confirmar...');
              const updateResp = await fetch('/api/stripe/update-customer-email', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  stripeCustomerId,
                  email: emailForBilling,
                }),
              });
              if (updateResp.ok) {
                console.log('✅ [PAYMENT] Email do cliente atualizado no Stripe');
              } else {
                console.warn('⚠️ [PAYMENT] Falha ao atualizar email no Stripe:', await updateResp.text());
              }
            } catch (err) {
              console.warn('⚠️ [PAYMENT] Erro ao atualizar email no Stripe:', err);
            }
          }
          
          const { error, paymentIntent } = await stripe.confirmPayment({
            elements,
            confirmParams: {
              payment_method_data: {
                billing_details: {
                  email: emailForBilling,
                },
              },
            },
            redirect: "if_required",
          });

        if (error) {
          console.error("❌ [STRIPE PAYMENT ERROR]:", {
            type: error.type,
            code: error.code,
            message: error.message,
            decline_code: (error as any).decline_code,
            param: (error as any).param,
            full_error: JSON.stringify(error)
          });
          
          fetch("/api/log-client-error", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              message: `Stripe Payment Error: ${error.message}`,
              context: { type: error.type, code: error.code, decline_code: (error as any).decline_code }
            })
          }).catch(() => {});
          
          setPaymentWasSuccessful(false);
          setAnimationKey((prev) => prev + 1);
          setCurrentStep(8); // payment_failed step
        } else if (
          paymentIntent?.status === "succeeded" ||
          paymentIntent?.status === "processing"
        ) {
          console.log(
            "Payment accepted via PaymentElement, status:",
            paymentIntent?.status
          );

          // Confirmar pagamento no backend e atualizar e-mail
          try {
            const confirmResponse = await fetch("/api/donation/confirm", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                paymentIntentId: paymentIntent.id,
                status: paymentIntent.status,
                email: localEmailRef.current || null,
              }),
            });

            if (!confirmResponse.ok) {
              throw new Error("Falha na confirmação do pagamento");
            }

            console.log("✅ Pagamento confirmado no banco de dados");
            
            // Salvar e-mail no localStorage
            if (localEmailRef.current) {
              localStorage.setItem("userEmail", localEmailRef.current);
            }
          } catch (error) {
            console.error("❌ Erro ao confirmar pagamento:", error);
          }

          // Payment successful
          setPaymentCompleted(true);
          setPaymentWasSuccessful(true);

          // Configure user session
          localStorage.setItem("isVerified", "true");
          localStorage.setItem("userPapel", "doador");
          localStorage.setItem("hasActiveSubscription", "true");
          localStorage.setItem("firstTimeAccess", "true");
          localStorage.setItem("hasDoadorRole", "true");

          // Flag para priorizar dashboard doador no próximo login
          sessionStorage.setItem("justCompletedDonation", "true");

          // Go to success screen
          setAnimationKey((prev) => prev + 1);
          setCurrentStep(5); // payment_success step
        } else {
          console.error("Payment failed, status:", paymentIntent?.status);
          setPaymentWasSuccessful(false);
          setAnimationKey((prev) => prev + 1);
          setCurrentStep(8); // payment_failed step
        }
        } // END else (payment flow)
      } catch (error: any) {
        console.error('❌ [PAYMENT/SETUP] Erro completo:', {
          message: error?.message,
          name: error?.name,
          stack: error?.stack?.substring(0, 500),
        });
        setPaymentWasSuccessful(false);
        setAnimationKey((prev) => prev + 1);
        setCurrentStep(8); // payment_failed step
      } finally {
        console.log('🏁 [PAYMENT ELEMENT] Finalizando handlePaymentElement, isProcessing = false');
        setIsProcessing(false);
      }
    };

    const handlePayment = async () => {
      if (!stripe || !elements || !clientSecret) {
        toast({
          title: "Erro",
          description: "Sistema de pagamento não carregado. Tente novamente.",
          variant: "destructive",
        });
        return;
      }

      setIsProcessing(true);

      try {
        // Get the card elements
        const cardNumberElement = elements.getElement(CardNumberElement);

        if (!cardNumberElement) {
          throw new Error("Elementos do cartão não encontrados");
        }

        const { error, paymentIntent } = await stripe.confirmCardPayment(
          clientSecret,
          {
            payment_method: {
              card: cardNumberElement,
              billing_details: {
                name: donationData.nome || "",
              },
            },
          }
        );

        if (error) {
          console.error("Stripe payment error:", error);
          // Payment failed - go to failure screen
          setPaymentWasSuccessful(false);
          setAnimationKey((prev) => prev + 1);
          setCurrentStep(8); // payment_failed step (index 8)
        } else if (
          paymentIntent?.status === "succeeded" ||
          paymentIntent?.status === "processing" ||
          paymentIntent?.status === "requires_action"
        ) {
          console.log("Payment accepted, status:", paymentIntent?.status);

          // ✅ CRITICAL: Confirmar pagamento no backend
          try {
            const confirmResponse = await fetch("/api/donation/confirm", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                paymentIntentId: paymentIntent.id,
                status: paymentIntent.status,
              }),
            });

            if (!confirmResponse.ok) {
              throw new Error("Falha na confirmação do pagamento");
            }

            console.log("✅ Pagamento confirmado no banco de dados");
          } catch (error) {
            console.error("❌ Erro ao confirmar pagamento:", error);
            // Mesmo assim prosseguir para não bloquear usuário
          }

          // Payment successful or processing - go to success screen
          setPaymentCompleted(true);
          setPaymentWasSuccessful(true);

          // Configure user session for first-time donor access
          localStorage.setItem("isVerified", "true");
          localStorage.setItem("userPapel", "doador");
          localStorage.setItem("hasActiveSubscription", "true");
          localStorage.setItem("firstTimeAccess", "true");
          localStorage.setItem("hasDoadorRole", "true");

          // Flag para priorizar dashboard doador no próximo login
          sessionStorage.setItem("justCompletedDonation", "true");

          // Go to success screen
          setAnimationKey((prev) => prev + 1);
          setCurrentStep(5); // payment_success step (index 5)
        } else {
          console.error("Payment failed, status:", paymentIntent?.status);
          // Payment failed - go to failure screen
          setPaymentWasSuccessful(false);
          setAnimationKey((prev) => prev + 1);
          setCurrentStep(8); // payment_failed step (index 8)
        }
      } catch (error: any) {
        // Payment failed - go to failure screen
        setPaymentWasSuccessful(false);
        setAnimationKey((prev) => prev + 1);
        setCurrentStep(8); // payment_failed step (index 8)
      } finally {
        setIsProcessing(false);
      }
    };

    // Obter periodicidade escolhida
    const selectedPeriodicity = localStorage.getItem('selectedPeriodicity') || 'mensal';
    
    // Converter periodicidade para texto legível
    const periodicityText: { [key: string]: string } = {
      'mensal': 'mensal',
      'trimestral': 'trimestral',
      'semestral': 'semestral',
      'anual': 'anual'
    };
    
    const displayPeriodicity = periodicityText[selectedPeriodicity] || 'mensal';

    return (
      <div
        className="text-center animate-fade-in"
        key={`payment-${animationKey}`}
      >
        <h1 className="text-xl font-bold mb-8" style={{ color: "#000000" }}>
          Finalize sua doação {displayPeriodicity}!
        </h1>

        {/* Resumo compacto expansível */}
        <div className="mb-8">
          <div
            className="flex items-center justify-between p-4 cursor-pointer"
            style={{ backgroundColor: "#F5F5F5" }}
            onClick={() => setResumoExpanded(!resumoExpanded)}
          >
            <div className="flex items-center">
              <span className="text-sm text-gray-700">Resumo da doação</span>
              <svg
                className={`ml-2 w-4 h-4 transition-transform duration-200 ${
                  resumoExpanded ? "rotate-180" : ""
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </div>
            <span className="font-semibold text-gray-900">
              {planInfo?.displayValue}
            </span>
          </div>

          {/* Detalhes expandidos */}
          {resumoExpanded && (
            <div
              className="p-4 border-t"
              style={{ backgroundColor: "#FAFAFA" }}
            >
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-gray-600">Plano escolhido:</span>
                <span className="text-sm font-semibold text-gray-900">
                  {planInfo?.name}
                </span>
              </div>
              
              {/* Mostrar valor mensal base para Platinum */}
              {planInfo?.id === 'platinum' && selectedPeriodicity !== 'mensal' && (() => {
                const urlParams = new URLSearchParams(window.location.search);
                const monthlyValue = urlParams.get("amount") || localStorage.getItem("customAmount") || '50';
                const monthlyFormatted = parseFloat(monthlyValue).toFixed(2).replace('.', ',');
                
                return (
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-gray-600">Valor mensal base:</span>
                    <span className="text-sm text-gray-700">
                      R$ {monthlyFormatted}/mês
                    </span>
                  </div>
                );
              })()}
              
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-gray-600">Valor {displayPeriodicity}:</span>
                <span className="text-sm text-green-600 font-semibold">
                  {planInfo?.displayValue}
                </span>
              </div>
              <div className="text-center">
                <span className="text-xs text-gray-500 italic">
                  Assinatura {displayPeriodicity} recorrente
                </span>
              </div>
            </div>
          )}
        </div>

        {/* ✅ Botão adaptativo Apple Pay/Google Pay */}
        {showAppleGooglePay && paymentRequest && (
          <div className="mb-6">
            <div
              className="rounded-xl p-4"
              style={{ backgroundColor: "#FFFFFF" }}
            >
              <PaymentRequestButtonElement
                options={{
                  paymentRequest,
                  style: {
                    paymentRequestButton: {
                      theme: "dark",
                      height: "48px",
                      type: "donate",
                    },
                  },
                }}
                className="w-full"
              />
            </div>

            {/* Separador "ou" */}
            <div className="flex items-center my-6">
              <div className="flex-1 h-px bg-gray-300"></div>
              <span className="px-3 text-sm text-gray-500">ou</span>
              <div className="flex-1 h-px bg-gray-300"></div>
            </div>
          </div>
        )}

        {/* ✅ PaymentElement moderno como alternativa */}
        <div className="mb-8">
          <div
            className="rounded-xl p-6 text-left"
            style={{ backgroundColor: "#FFFFFF" }}
          >
            {/* Campo de E-mail antes do pagamento (obrigatório) */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Seu e-mail para novidades <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                value={localEmail}
                onChange={(e) => setLocalEmail(e.target.value)}
                placeholder="seu@email.com"
                className={`w-full h-12 px-4 rounded-lg border focus:ring-1 outline-none transition-colors ${
                  localEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(localEmail)
                    ? 'border-red-400 focus:border-red-500 focus:ring-red-500'
                    : 'border-gray-300 focus:border-yellow-500 focus:ring-yellow-500'
                }`}
                data-testid="input-checkout-email"
              />
              {localEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(localEmail) && (
                <p className="text-red-500 text-sm mt-1">Digite um e-mail válido</p>
              )}
            </div>

            {/* PaymentElement inclui métodos tradicionais */}
            {elementsReady && (
              <PaymentElement
                options={{
                  layout: { type: "tabs", defaultCollapsed: false },
                  paymentMethodOrder: ["card"],
                  fields: { billingDetails: { name: "auto", email: "never" } },
                }}
              />
            )}

            {/* Botão de pagamento */}
            <button
              onClick={handlePaymentElement}
              disabled={isProcessing || !stripe || !elements || !clientSecret || !localEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(localEmail)}
              className="w-full h-12 rounded-xl font-medium mt-6"
              style={{ 
                backgroundColor: (isProcessing || !localEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(localEmail)) ? "#E5E5E5" : "#FFCC00", 
                color: (isProcessing || !localEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(localEmail)) ? "#999" : "#000" 
              }}
            >
              {isProcessing ? "Processando..." : `Confirmar doação ${planInfo?.displayValue}`}
            </button>
          </div>
        </div>

        <p className="text-sm text-center" style={{ color: "#B0B0B0" }}>
          {isProcessing
            ? "Processando pagamento..."
            : "Seus dados estão seguros e criptografados"}
        </p>
      </div>
    );
  };

  // ✅ Validação das chaves da Stripe
  if (isCheckingStripe) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <Logo size="lg" className="mx-auto mb-4" />
          <p style={{ color: "#B0B0B0" }}>
            Verificando configurações de pagamento...
          </p>
        </div>
      </div>
    );
  }

  if (!hasKeys) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-6">
          <Logo size="lg" className="mx-auto mb-8" />
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 bg-red-100 rounded-full">
              <svg
                className="w-6 h-6 text-red-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                />
              </svg>
            </div>
            <h1 className="text-xl font-bold mb-4 text-red-900">
              Sistema Temporariamente Indisponível
            </h1>
            <p className="text-red-700 mb-6">
              O sistema de pagamentos está sendo configurado. Tente novamente em
              alguns minutos ou entre em contato conosco.
            </p>
            <div className="space-y-3">
              <Button
                onClick={() => {
                  // Ao invés de reload completo, recarregar apenas os dados do Stripe
                  setIsLoading(true);
                  setTimeout(() => {
                    setIsLoading(false);
                  }, 1000);
                }}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                Tentar Novamente
              </Button>
              <Button
                variant="outline"
                onClick={() => setLocation("/")}
                className="w-full"
              >
                Voltar ao Início
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!planInfo) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <Logo size="lg" className="mx-auto mb-4" />
          <p style={{ color: "#B0B0B0" }}>Carregando...</p>
        </div>
      </div>
    );
  }

  // Welcome screen
  if (showWelcome || currentStep === -1) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-6">
          <div className="animate-fade-in">
            <Logo size="lg" className="mx-auto mb-8" />
            <h1
              className="text-3xl font-bold mb-4"
              style={{ color: "#000000" }}
            >
              Obrigado por fazer parte do Grito!
            </h1>
            <p className="text-lg" style={{ color: "#B0B0B0" }}>
              Vamos configurar seu cadastro.
            </p>
            <div className="mt-8">
              <div className="w-8 h-8 mx-auto border-4 border-yellow-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Back arrow - top left - moved up and more left */}
      <div className="absolute top-6 left-6 z-10">
        <Button
          variant="ghost"
          onClick={handlePrevious}
          className="p-2 hover:bg-white/20 rounded-full"
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M15 18L9 12L15 6"
              stroke="#000000"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </Button>
      </div>

      {/* Main content */}
      <div className="min-h-screen">
        <div className="w-full max-w-md mx-auto">
          {/* Form steps */}
          <AnimatePresence mode="wait">
            {safeCurrentStepData?.type === "impact" ? (
              // Impact Journey Screen - Fundo branco sem card
              <motion.div
                className="w-full min-h-screen bg-white flex flex-col relative"
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -50 }}
                transition={{ duration: 0.6, ease: "easeInOut" }}
              >
                <div className="flex flex-col justify-between h-full px-8 py-16">
                  {/* Question text */}
                  <div className="text-left flex-1 flex items-start justify-start pt-32 pl-8">
                    <h1
                      className="leading-tight"
                      style={{
                        color: "#000000",
                        fontFamily: "Inter",
                        fontSize: "24px",
                        fontWeight: "normal",
                      }}
                    >
                      Pronto para
                      <br />
                      começar sua
                      <br />
                      <span style={{ fontWeight: "bold" }}>
                        jornada de
                        <br />
                        impacto?
                      </span>
                    </h1>
                  </div>

                  {/* Yellow square button fixed at bottom right corner */}
                  <button
                  onClick={handleNext}
                  disabled={isLoading}
                  className="absolute bottom-8 right-8 w-16 h-16 bg-yellow-400 hover:bg-yellow-500 text-black rounded-lg flex items-center justify-center shadow-lg transition-all duration-300"
                  data-testid="button-advance-impact"
                  >
                    <ChevronRight className="w-6 h-6" />
                  </button>                  
                </div>
              </motion.div>
            ) :
              safeCurrentStepData?.type === "payment" ? (
                // Payment Screen
                <motion.div
                className="w-full min-h-screen bg-white flex flex-col relative"
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -50 }}
                transition={{ duration: 0.6, ease: "easeInOut" }}
                >
                  <div className="flex flex-col h-full px-8 py-8">
                    <div
                      className="flex-1 flex flex-col justify-center"
                      style={{ paddingTop: "60px" }}
                    >
                      {/* Guardas para evitar montar Elements sem clientSecret válido */}
                      {!isValidClientSecret(clientSecret) ? (
                        <div className="text-center text-sm text-gray-500">
                          Preparando pagamento…
                        </div>
                      ) : (
                        <Elements
                          stripe={stripePromise}
                          options={{ clientSecret }}
                        >
                          <PaymentStep />
                        </Elements>
                      )}
                    </div>
                  </div>
                </motion.div>
              ) : safeCurrentStepData?.type === "payment_success" ? (
                // Payment Success Screen
                <motion.div
                  className="w-full bg-white flex flex-col min-h-screen relative"
                  initial={{ opacity: 0, y: 50 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -50 }}
                  transition={{ duration: 0.6, ease: "easeInOut" }}
                >
                  <div
                    className="flex flex-col h-full px-8 py-8 justify-center items-center"
                    style={{ paddingTop: "80px" }}
                  >
                    {/* Title */}
                    <div className="text-center mb-6 mt-8">
                      <p
                        className="mb-2"
                        style={{
                          color: "#000000",
                          fontFamily: "Inter",
                          fontSize: "24px",
                          fontWeight: "normal",
                        }}
                      >
                        Pagamento aprovado!
                      </p>
                      <p
                        style={{
                          color: "#000000",
                          fontFamily: "Inter",
                          fontSize: "24px",
                          fontWeight: "bold",
                          whiteSpace: "nowrap",
                        }}
                      >
                        Seu impacto já começou! 🎉
                      </p>
                    </div>

                    {/* Success Icon */}
                    <div className="mb-8 mt-16">
                      <img
                        src={successIcon}
                        alt="Pagamento aprovado"
                        className="w-40 h-40"
                      />
                    </div>

                    {/* Impact Message */}
                    <div className="absolute bottom-48 left-8 text-left">
                      <p
                        style={{
                          color: "#000000",
                          fontFamily: "Inter",
                          fontSize: "24px",
                          lineHeight: "1.2",
                        }}
                      >
                        Sua contribuição
                        <br />
                        está ecoando em <strong>novas</strong>
                        <br />
                        <strong>vidas transformadas.</strong>
                      </p>
                    </div>
                  </div>

                  {/* Continue button - positioned at bottom right */}
                  <button
                    onClick={() => {
                      // 🔧 CORREÇÃO AUTO-RELOAD: Timeout mantido apenas para animação (150ms é seguro)
                      setTimeout(() => {
                        setAnimationKey((prev) => prev + 1);
                        setCurrentStep(6); // Go to welcome_post_payment step (index 6)
                      }, 150);
                    }}
                    className="absolute bottom-8 right-8 w-16 h-16 bg-yellow-400 hover:bg-yellow-500 text-black rounded-lg flex items-center justify-center shadow-lg transition-all duration-300"
                    data-testid="button-advance-success"
                  >
                    <ChevronRight className="w-6 h-6" />
                  </button>
                </motion.div>
              ) : safeCurrentStepData?.type === "welcome_post_payment" ? (
                // Welcome Post Payment Screen - Primeira nova tela
                <motion.div
                  className="w-full bg-white flex flex-col min-h-screen relative"
                  initial={{ opacity: 0, y: 50 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -50 }}
                  transition={{ duration: 0.6, ease: "easeInOut" }}
                >
                  <div className="flex flex-col h-full px-8 py-8 justify-center items-center">
                    {/* Usar a imagem exata fornecida pelo usuário */}
                    <div className="flex-1 flex flex-col justify-center items-center">
                      <img
                        src="/attached_assets/image_1758819895383.png"
                        alt="Que bom ter você por aqui!"
                        className="w-full max-w-md h-auto"
                      />
                    </div>
                  </div>

                  {/* Continue button - positioned at bottom right */}
                  <button
                    onClick={() => {
                      setTimeout(() => {
                        setAnimationKey((prev) => prev + 1);
                        setCurrentStep(7); // Go to grito_selection step (index 7)
                      }, 150);
                    }}
                    className="absolute bottom-8 right-8 w-16 h-16 bg-yellow-400 hover:bg-yellow-500 text-black rounded-lg flex items-center justify-center shadow-lg transition-all duration-300"
                    data-testid="button-advance-welcome"
                  >
                    <ChevronRight className="w-6 h-6" />
                  </button>
                </motion.div>
              ) : safeCurrentStepData?.type === "grito_selection" ? (
                // Grito Selection Screen - Segunda nova tela
                <motion.div
                  className="w-full bg-white flex flex-col min-h-screen relative"
                  initial={{ opacity: 0, y: 50 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -50 }}
                  transition={{ duration: 0.6, ease: "easeInOut" }}
                >
                  <div className="flex flex-col h-full px-8 py-8 justify-center items-center">
                    {/* Title */}
                    <div className="text-center mb-12 mt-16">
                      <h1
                        className="text-3xl font-normal mb-4"
                        style={{ color: "#000000", fontFamily: "Inter" }}
                      >
                        Agora me conta, qual é<br />o seu <strong>Grito</strong>?
                      </h1>
                    </div>

                    {/* Options */}
                    <div className="flex flex-col space-y-4 w-full max-w-sm">
                      {[
                        { value: "educacao", label: "Pela Educação" },
                        { value: "cultura", label: "Pela Cultura" },
                        { value: "esporte", label: "Pelo Esporte" },
                        { value: "criancas", label: "Pelas Crianças" },
                        { value: "jovens", label: "Pelos Jovens" },
                      ].map((option) => (
                        <button
                          key={option.value}
                          onClick={async () => {
                            // Salvar escolha
                            setDonationData((prev) => ({
                              ...prev,
                              grito_selection: option.value,
                            }));

                            // Salvar no banco
                            // TRECHO ALTERADO
                            try {
                              await apiRequest("/api/user-causas", {
                                method: "POST",
                                body: JSON.stringify({
                                  telefone: donationData.telefone_numero, // ok, o backend normaliza
                                  causa: option.value,
                                }),
                              });
                            } catch (e) {
                              console.error("Erro ao salvar causa:", e);
                            }

                            // Ir direto para a home (email já foi coletado no pagamento)
                            toast({
                              title: "Cadastro concluído!",
                              description: "Bem-vindo ao Clube do Grito!",
                              duration: 3000,
                            });
                            setLocation("/welcome");
                          }}
                          className="w-full py-4 px-6 rounded-full text-white font-medium text-lg transition-all duration-300 bg-[#2d3748] hover:bg-yellow-500"
                          style={{
                            fontFamily: "Inter",
                          }}
                          data-testid={`button-grito-${option.value}`}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </motion.div>
              ) : safeCurrentStepData?.type === "payment_failed" ? (
                // Payment Failed Screen - Layout Moderno
                <motion.div
                  className="w-full min-h-screen bg-white"
                  initial={{ opacity: 0, y: 50 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -50 }}
                  transition={{ duration: 0.6, ease: "easeInOut" }}
                >
                  <div className="flex flex-col h-screen justify-between px-6 py-8">
                    {/* Top spacing */}
                    <div className="flex-1"></div>

                    {/* Main content */}
                    <div className="flex flex-col items-center text-center px-4">
                      {/* Error Icon */}
                      <div className="mb-8">
                        <img
                          src="attached_assets/OPPS_Prancheta 1 1_1756924526569.png"
                          alt="Ops! Algo não deu certo"
                          className="w-44 h-44 mx-auto"
                        />
                      </div>

                      {/* Error Message with better typography */}
                      <div className="mb-8 px-2">
                        <h1
                          className="text-2xl font-bold mb-3"
                          style={{
                            color: "#2D3748",
                            fontFamily: "Inter",
                            lineHeight: "1.3",
                          }}
                        >
                          Ops! Algo não deu certo
                        </h1>
                        <p
                          className="text-base mb-4"
                          style={{
                            color: "#4A5568",
                            fontFamily: "Inter",
                            lineHeight: "1.4",
                          }}
                        >
                          Não conseguimos processar o pagamento,
                          <br />
                          mas seu{" "}
                          <span className="font-bold text-orange-600">
                            Grito
                          </span>{" "}
                          continua importante.
                        </p>
                        <p
                          className="text-sm"
                          style={{
                            color: "#718096",
                            fontFamily: "Inter",
                            lineHeight: "1.4",
                          }}
                        >
                          Isso pode acontecer por diversos motivos. Vamos tentar
                          novamente?
                        </p>
                      </div>
                    </div>

                    {/* Bottom section with buttons */}
                    <div className="flex flex-col space-y-4 px-4">
                      {/* Try Again button - principal */}
                      <button
                        onClick={() => {
                          // 🔧 CORREÇÃO AUTO-RELOAD: Timeout mantido apenas para animação UX
                          setTimeout(() => {
                            setAnimationKey((prev) => prev + 1);
                            setCurrentStep(4); // Go back to payment step (index 4)
                          }, 150);
                        }}
                        className="w-full h-14 rounded-2xl flex items-center justify-center space-x-3 font-medium transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
                        style={{
                          backgroundColor: "#FFCC00",
                          color: "#000000",
                          fontFamily: "Inter",
                          fontSize: "18px",
                        }}
                        data-testid="button-advance-failure"
                      >
                        <span>Avançar</span>
                        <ArrowRight className="w-5 h-5" />
                      </button>

                      {/* Secondary button - ajuda */}
                      <button
                        onClick={() => {
                          // Pode abrir um modal de ajuda ou redirecionar para suporte
                          alert("Em breve teremos um sistema de ajuda completo!");
                        }}
                        className="w-full h-12 rounded-xl flex items-center justify-center space-x-2 font-medium transition-all duration-300 border-2"
                        style={{
                          backgroundColor: "transparent",
                          borderColor: "#D69E2E",
                          color: "#D69E2E",
                          fontFamily: "Inter",
                          fontSize: "16px",
                        }}
                      >
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                        <span>Preciso de ajuda</span>
                      </button>

                      {/* Bottom spacing */}
                      <div className="h-4"></div>
                    </div>
                  </div>
                </motion.div>
              ) : safeCurrentStepData?.type === "sms_verification" ? (
                // SMS Verification Screen
                <motion.div
                className="w-full min-h-screen bg-white flex flex-col relative"
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -50 }}
                transition={{ duration: 0.6, ease: "easeInOut" }}
                >
                  <div
                    className="flex flex-col h-full px-8 py-8 justify-center items-center"
                    style={{ paddingTop: "25%", paddingBottom: "25%" }}
                  >
                    {/* SMS Verification Content */}
                    <div className="text-center mb-8">
                      <h1
                        className="text-xl font-bold mb-4"
                        style={{ color: "#000000", fontFamily: "Inter" }}
                      >
                        Confirme Código
                      </h1>
                      <p
                        className="text-sm"
                        style={{ color: "#666666", fontFamily: "Inter" }}
                      >
                        Um código de 6 dígitos foi enviado
                        <br />
                        para{" "}
                        {maskPhoneNumber(
                          donationData.telefone_numero || donationData.telefone
                        )}
                      </p>
                    </div>

                    {/* 4-digit input fields */}
                    <div className="flex space-x-3 mb-6">
                      {smsCodeInputs.map((digit, index) => (
                        <input
                          key={index}
                          id={`sms-input-${index}`}
                          type="tel"
                          inputMode="numeric"
                          pattern="[0-9]*"
                          maxLength={1}
                          value={digit}
                          onChange={(e) =>
                            handleSMSCodeChange(index, e.target.value)
                          }
                          onKeyDown={(e) => handleSMSKeyDown(index, e)}
                          className="w-12 h-12 text-center text-lg font-medium border-2 rounded-lg focus:outline-none"
                          style={{
                            backgroundColor: "#FFFFFF",
                            borderColor: getSMSInputBorderColor(index, digit),
                            fontFamily: "Inter",
                          }}
                          disabled={isSendingSMS}
                          autoFocus={index === 0}
                        />
                      ))}
                    </div>

                    {/* Resend code link */}
                    <button
                      onClick={resendSMSCode}
                      disabled={isSendingSMS}
                      className="text-blue-600 text-sm hover:text-blue-700 mb-12"
                      style={{ fontFamily: "Inter" }}
                    >
                      {isSendingSMS ? "Enviando..." : "Reenviar o código"}
                    </button>
                  </div>

                  {/* Continue button - fixed position */}
                  <button
                    onClick={handleNext}
                    disabled={donationData.sms_code.length !== 6 || isLoading}
                    className="absolute bottom-8 right-8 w-16 h-16 bg-yellow-400 hover:bg-yellow-500 text-black rounded-lg flex items-center justify-center shadow-lg transition-all duration-300"
                    style={{
                      backgroundColor:
                        donationData.sms_code.length === 6
                          ? "#fbbf24"
                          : "#E5E5E5",
                      color:
                        donationData.sms_code.length === 6
                          ? "#000000"
                          : "#999999",
                    }}
                    data-testid="button-advance-sms"
                  >
                    <ChevronRight className="w-6 h-6" />
                  </button>
                </motion.div>
              ) : safeCurrentStepData ? (
                // Form steps - Fundo branco sem card
                <motion.div
                className="w-full min-h-screen bg-white flex flex-col relative"
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -50 }}
                transition={{ duration: 0.6, ease: "easeInOut" }}
                >
                  <div className="flex flex-col h-full px-8 py-8">
                    {/* Header com título e subtítulo - movido mais para baixo */}
                    <div className="mb-8 mt-16">
                      <h1
                        className="text-xl font-bold mb-3"
                        style={{ color: "#000000", fontFamily: "Inter" }}
                      >
                        O primeiro passo já foi dado!
                      </h1>
                      <p
                        className="text-sm"
                        style={{ color: "#666666", fontFamily: "Inter" }}
                      >
                        Agora é hora de garantir que sua contribuição e seus
                        benefícios cheguem até você.
                      </p>
                    </div>

                    {/* Pergunta específica */}
                    <div className="mb-6" key={`step-${animationKey}`}>
                      <label
                        className="block text-sm font-medium mb-3"
                        style={{ color: "#000000", fontFamily: "Inter" }}
                      >
                        {safeCurrentStepData?.question}
                      </label>

                      {/* Input field */}
                      <div className="relative animate-slide-in-left">
                        {safeCurrentStepData && safeCurrentStepData.field === "telefone" ? (
                          // Campo de telefone separado em DDI e número
                          <div className="w-full space-y-4">
                            <div className="flex gap-2">
                              {/* Campo DDI fixo */}
                              <div className="w-24 flex-shrink-0">
                                <input
                                  type="text"
                                  value="+55"
                                  readOnly
                                  className="w-full h-14 border-2 rounded-xl text-black text-center bg-gray-100 cursor-not-allowed font-medium"
                                  style={{
                                    backgroundColor: "#F3F4F6",
                                    borderColor: "#E5E7EB",
                                    fontFamily: "Inter",
                                    fontSize: "16px",
                                    color: "#6B7280",
                                  }}
                                  data-testid="input-ddi"
                                />
                              </div>

                              {/* Campo número com máscara */}
                              <div className="flex-1 min-w-0">
                                <input
                                   type="tel"
                                   pattern="[0-9]*"
                                  inputMode="numeric"
                                  placeholder="(11) 99999-9999"
                                  value={donationData.telefone_numero || ""}
                                  onChange={(e) => handleInputChange(e.target.value)}
                                  className="w-full h-14 border-2 rounded-xl text-black placeholder:text-gray-400 focus:outline-none focus:ring-0 px-4"
                                  style={{
                                    backgroundColor: "#FFFFFF",
                                    borderColor: "#3B82F6",
                                    fontFamily: "Inter",
                                    fontSize: "16px",
                                  }}
                                  autoFocus
                                  disabled={isLoading}
                                  maxLength={15}
                                  onKeyDown={(e) => {
                                    if ((e.key === "Enter" || e.key === "Done") && !isLoading) {
                                      e.preventDefault();
                                      handleNext();
                                    }
                                  }}
                                  data-testid="input-telefone"
                                />
                              </div>
                            </div>
                          </div>
                        ) : (
                          // Campos normais (não telefone)
                          <input
                            type={safeCurrentStepData.type || "text"}
                            placeholder={safeCurrentStepData.placeholder || ""}
                            value={
                              (donationData[
                                safeCurrentStepData.field
                              ] as string) || ""
                            }
                            onChange={(e) => handleInputChange(e.target.value)}
                            className="w-full h-14 border-2 rounded-xl text-black placeholder:text-gray-400 focus:outline-none focus:ring-0 px-4"
                            style={{
                              backgroundColor: "#FFFFFF",
                              borderColor: "#3B82F6",
                              fontFamily: "Inter",
                              fontSize: "16px",
                            }}
                            autoFocus
                            disabled={isLoading}
                            onFocus={() => {
                              // Don't re-enable auto-advance immediately on focus if we just navigated back
                              if (!justNavigatedBack) {
                                setAllowAutoAdvance(true);
                              }
                            }}
                            onKeyDown={(e) => {
                              if (
                                (e.key === "Enter" || e.key === "Done") &&
                                !isLoading
                              ) {
                                e.preventDefault();
                                handleNext();
                              }
                            }}
                            onBlur={() => {
                              // Removido auto-advance para evitar pulo de steps
                              // Usuário deve clicar no botão para avançar
                            }}
                            data-testid={`input-${safeCurrentStepData?.field}`}
                          />
                        )}
                      </div>
                    </div>

                    {/* Checkbox de termos obrigatório (apenas para step nome) */}
                    {safeCurrentStepData?.field === "nome" && (
                      <div className="mt-8">
                        <div className="flex items-start space-x-3">
                          <input
                            type="checkbox"
                            id="terms"
                            checked={termsAccepted}
                            onChange={(e) => setTermsAccepted(e.target.checked)}
                            className="w-5 h-5 mt-0.5 rounded border-2 border-gray-300"
                            style={{ accentColor: "#FFD700" }}
                          />
                          <label
                            htmlFor="terms"
                            className="text-sm"
                            style={{ color: "#666666", fontFamily: "Inter" }}
                          >
                            Li e concordo com os{" "}
                            <span
                              className="text-blue-600 underline cursor-pointer hover:text-blue-700"
                              onClick={() => {
                                setLocation("/termos-servicos");
                              }}
                            >
                              Termos e Condições
                            </span>{" "}
                            e a{" "}
                            <span
                              className="text-blue-600 underline cursor-pointer hover:text-blue-700"
                              onClick={() => {
                                setLocation("/termos-servicos");
                              }}
                            >
                              Política de Privacidade
                            </span>
                            .
                          </label>
                        </div>

                        {/* Texto informativo discreto */}
                        <p
                          className="text-xs mt-4 ml-8 italic"
                          style={{ color: "#999999", fontFamily: "Inter" }}
                        >
                          É necessário concordar com os termos de uso para
                          continuar
                        </p>
                      </div>
                    )}

                    {/* Loading indicator for payment preparation */}
                    {isPreparingPayment && (
                      <div className="text-center mt-6">
                        <div className="w-6 h-6 mx-auto border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                      </div>
                    )}
                  </div>

                  {/* TRECHO ALTERADO */}
                  {safeCurrentStepData?.type !== "payment" && (
                    <button
                      onClick={handleNext}
                      disabled={
                        isLoading ||
                        (safeCurrentStepData?.field === "nome" && !termsAccepted)
                      }
                      className="absolute bottom-8 right-8 w-16 h-16 bg-yellow-400 hover:bg-yellow-500 text-black rounded-lg flex items-center justify-center shadow-lg transition-all duration-300"
                      style={{
                        backgroundColor:
                          isLoading ||
                            (safeCurrentStepData?.field === "nome" &&
                              !termsAccepted)
                            ? "#E5E5E5"
                            : "#fbbf24",
                        color:
                          isLoading ||
                            (safeCurrentStepData?.field === "nome" &&
                              !termsAccepted)
                            ? "#999999"
                            : "#000000",
                      }}
                      data-testid={`button-advance-${safeCurrentStepData?.field}`}
                    >
                      <ChevronRight className="w-6 h-6" />
                    </button>
                  )}
                </motion.div>
              ) : (
                // 🔧 CORREÇÃO FINAL: Fallback robusto para casos extremos onde safeCurrentStepData é null
                (() => {
                  console.warn(
                    "⚠️ [RACE CONDITION] Step data temporariamente indisponível",
                    {
                      currentStep,
                      stepsLength: steps.length,
                      timestamp: new Date().toISOString(),
                    }
                  );

                  // NÃO resetar para step 0 - apenas aguardar re-render
                  return (
                    <div className="w-full bg-white flex flex-col min-h-screen justify-center items-center">
                      <div className="w-8 h-8 border-4 border-yellow-500 border-t-transparent rounded-full animate-spin"></div>
                      <p className="mt-4 text-sm text-gray-600">
                        Processando...
                      </p>
                    </div>
                  );
                })()
              )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

