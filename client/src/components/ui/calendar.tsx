import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { DayPicker } from "react-day-picker";
import { ptBR } from "date-fns/locale";
import { addMonths, subMonths, setMonth, setYear } from "date-fns";

import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";

export type CalendarProps = React.ComponentProps<typeof DayPicker>;

const monthNames = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
]

type CaptionContextType = {
  currentMonth: Date
  years: number[]
  handlePrevMonth: (e: React.MouseEvent) => void
  handleNextMonth: (e: React.MouseEvent) => void
  handleMonthSelect: (e: React.ChangeEvent<HTMLSelectElement>) => void
  handleYearSelect: (e: React.ChangeEvent<HTMLSelectElement>) => void
}

const CaptionContext = React.createContext<CaptionContextType | null>(null)

const CalendarCaption = React.memo(function CalendarCaption() {
  const ctx = React.useContext(CaptionContext)
  if (!ctx) return null
  const { currentMonth, years, handlePrevMonth, handleNextMonth, handleMonthSelect, handleYearSelect } = ctx

  return (
    <div className="flex items-center justify-between py-2 px-1">
      <button
        type="button"
        onClick={handlePrevMonth}
        className={cn(
          buttonVariants({ variant: "outline" }),
          "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100"
        )}
      >
        <ChevronLeft className="h-4 w-4" />
      </button>
      <div className="flex items-center gap-1">
        <select
          value={currentMonth.getMonth()}
          onChange={handleMonthSelect}
          className="h-7 w-[100px] text-sm font-medium rounded-md border border-input bg-background px-2 cursor-pointer focus:outline-none focus:ring-1 focus:ring-ring"
        >
          {monthNames.map((name, index) => (
            <option key={name} value={index}>{name}</option>
          ))}
        </select>
        <select
          value={currentMonth.getFullYear()}
          onChange={handleYearSelect}
          className="h-7 w-[75px] text-sm font-medium rounded-md border border-input bg-background px-2 cursor-pointer focus:outline-none focus:ring-1 focus:ring-ring"
        >
          {years.map((year) => (
            <option key={year} value={year}>{year}</option>
          ))}
        </select>
      </div>
      <button
        type="button"
        onClick={handleNextMonth}
        className={cn(
          buttonVariants({ variant: "outline" }),
          "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100"
        )}
      >
        <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  )
})

const COMPONENTS = {
  IconLeft: ({ className, ...props }: React.HTMLAttributes<SVGElement>) => (
    <ChevronLeft className={cn("h-4 w-4", className)} {...(props as any)} />
  ),
  IconRight: ({ className, ...props }: React.HTMLAttributes<SVGElement>) => (
    <ChevronRight className={cn("h-4 w-4", className)} {...(props as any)} />
  ),
  Caption: CalendarCaption,
}

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  month: externalMonth,
  onMonthChange: externalOnMonthChange,
  ...props
}: CalendarProps) {
  const [currentMonth, setCurrentMonthState] = React.useState<Date>(
    props.defaultMonth || externalMonth || new Date()
  );

  React.useEffect(() => {
    if (externalMonth) {
      setCurrentMonthState(externalMonth)
    }
  }, [externalMonth])

  const currentYear = currentMonth.getFullYear()
  const years = React.useMemo(() => {
    const result: number[] = []
    for (let year = currentYear - 10; year <= currentYear + 10; year++) {
      result.push(year)
    }
    return result
  }, [currentYear])

  const updateMonth = React.useCallback((newDate: Date) => {
    setCurrentMonthState(newDate)
    if (externalOnMonthChange) externalOnMonthChange(newDate)
  }, [externalOnMonthChange])

  const handlePrevMonth = React.useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setCurrentMonthState(prev => {
      const next = subMonths(prev, 1)
      if (externalOnMonthChange) externalOnMonthChange(next)
      return next
    })
  }, [externalOnMonthChange])

  const handleNextMonth = React.useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setCurrentMonthState(prev => {
      const next = addMonths(prev, 1)
      if (externalOnMonthChange) externalOnMonthChange(next)
      return next
    })
  }, [externalOnMonthChange])

  const handleMonthSelect = React.useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    setCurrentMonthState(prev => {
      const next = setMonth(prev, parseInt(e.target.value))
      if (externalOnMonthChange) externalOnMonthChange(next)
      return next
    })
  }, [externalOnMonthChange])

  const handleYearSelect = React.useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    setCurrentMonthState(prev => {
      const next = setYear(prev, parseInt(e.target.value))
      if (externalOnMonthChange) externalOnMonthChange(next)
      return next
    })
  }, [externalOnMonthChange])

  const captionCtx = React.useMemo<CaptionContextType>(() => ({
    currentMonth,
    years,
    handlePrevMonth,
    handleNextMonth,
    handleMonthSelect,
    handleYearSelect,
  }), [currentMonth, years, handlePrevMonth, handleNextMonth, handleMonthSelect, handleYearSelect])

  return (
    <CaptionContext.Provider value={captionCtx}>
      <DayPicker
        locale={ptBR}
        month={currentMonth}
        onMonthChange={updateMonth}
        showOutsideDays={showOutsideDays}
        className={cn("p-3", className)}
        classNames={{
          months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
          month: "space-y-4 w-[280px]",
          caption: "flex justify-center pt-1 relative items-center",
          caption_label: "hidden",
          nav: "hidden",
          nav_button: "hidden",
          nav_button_previous: "hidden",
          nav_button_next: "hidden",
          table: "w-full border-collapse space-y-1",
          head_row: "flex justify-between",
          head_cell:
            "text-muted-foreground rounded-md w-9 font-normal text-[0.8rem] capitalize",
          row: "flex w-full mt-2 justify-between",
          cell: "h-9 w-9 text-center text-sm p-0 relative [&:has([aria-selected].day-range-end)]:rounded-r-md [&:has([aria-selected].day-outside)]:bg-accent/50 [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
          day: cn(
            buttonVariants({ variant: "ghost" }),
            "h-9 w-9 p-0 font-normal aria-selected:opacity-100"
          ),
          day_range_end: "day-range-end",
          day_selected:
            "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
          day_today: "bg-accent text-accent-foreground",
          day_outside:
            "day-outside text-muted-foreground aria-selected:bg-accent/50 aria-selected:text-muted-foreground",
          day_disabled: "text-muted-foreground opacity-50",
          day_range_middle:
            "aria-selected:bg-accent aria-selected:text-accent-foreground",
          day_hidden: "invisible",
          ...classNames,
        }}
        components={COMPONENTS}
        {...props}
      />
    </CaptionContext.Provider>
  )
}
Calendar.displayName = "Calendar";

export { Calendar };