import { useState, useCallback, useEffect } from 'react';
import { 
  MondayBoard, 
  MondayItem, 
  MondayWorkspace, 
  MondayUser, 
  MondayApiResponse,
  MondayQueryResponse,
  MondayConfig,
  MondayRequestOptions,
  MondayBoardsState,
  MondayItemsState,
  MondayWorkspacesState,
  MondayUsersState 
} from '@shared/monday-types';

// GraphQL Queries
const BOARDS_QUERY = `
  query GetBoards($limit: Int) {
    boards(limit: $limit) {
      id
      name
      description
      board_kind
      state
      workspace_id
      columns {
        id
        title
        type
      }
      groups {
        id
        title
        color
        position
      }
    }
  }
`;

const BOARD_ITEMS_QUERY = `
  query GetBoardItems($boardId: ID!, $limit: Int) {
    boards(ids: [$boardId]) {
      id
      name
      items(limit: $limit) {
        id
        name
        state
        created_at
        updated_at
        creator_id
        column_values {
          id
          title
          type
          value
          text
        }
      }
    }
  }
`;

const WORKSPACES_QUERY = `
  query GetWorkspaces {
    workspaces {
      id
      name
      kind
      description
    }
  }
`;

const USERS_QUERY = `
  query GetUsers {
    users {
      id
      name
      email
      url
      photo_original
      is_guest
      is_pending
      enabled
    }
  }
`;

const ME_QUERY = `
  query GetMe {
    me {
      id
      name
      email
      url
      photo_original
      is_guest
      is_pending
      enabled
    }
  }
`;

const CREATE_ITEM_MUTATION = `
  mutation CreateItem($boardId: ID!, $itemName: String!, $columnValues: JSON) {
    create_item(board_id: $boardId, item_name: $itemName, column_values: $columnValues) {
      id
      name
      state
      created_at
      column_values {
        id
        title
        type
        value
        text
      }
    }
  }
`;

class MondayGraphQLClient {
  private config: MondayConfig;
  private baseUrl: string = 'https://api.monday.com/v2';

  constructor(config: MondayConfig) {
    this.config = config;
  }

  private getAuthHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'API-Version': this.config.apiVersion || '2023-10',
    };

    // Prefer MONDAY_TOKEN over MONDAY_API_KEY
    if (this.config.token) {
      headers['Authorization'] = `Bearer ${this.config.token}`;
    } else if (this.config.apiKey) {
      headers['Authorization'] = this.config.apiKey;
    }

    return headers;
  }

  async query<T = any>(
    query: string, 
    options: MondayRequestOptions = {}
  ): Promise<MondayApiResponse<T>> {
    try {
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({
          query,
          variables: options.variables || {},
          operationName: options.operationName,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result: MondayApiResponse<T> = await response.json();

      if (result.errors && result.errors.length > 0) {
        throw new Error(`GraphQL Error: ${result.errors[0].message}`);
      }

      return result;
    } catch (error) {
      console.error('Monday.com API Error:', error);
      throw error;
    }
  }

  // API Methods
  async getBoards(limit: number = 25): Promise<MondayBoard[]> {
    const result = await this.query<MondayQueryResponse>(BOARDS_QUERY, {
      variables: { limit }
    });
    return result.data.boards || [];
  }

  async getBoardItems(boardId: string, limit: number = 50): Promise<MondayItem[]> {
    const result = await this.query<MondayQueryResponse>(BOARD_ITEMS_QUERY, {
      variables: { boardId, limit }
    });
    return result.data.boards?.[0]?.items || [];
  }

  async getWorkspaces(): Promise<MondayWorkspace[]> {
    const result = await this.query<MondayQueryResponse>(WORKSPACES_QUERY);
    return result.data.workspaces || [];
  }

  async getUsers(): Promise<MondayUser[]> {
    const result = await this.query<MondayQueryResponse>(USERS_QUERY);
    return result.data.users || [];
  }

  async getMe(): Promise<MondayUser | null> {
    const result = await this.query<MondayQueryResponse>(ME_QUERY);
    return result.data.me || null;
  }

  async createItem(boardId: string, itemName: string, columnValues?: Record<string, any>): Promise<MondayItem> {
    const result = await this.query<{ create_item: MondayItem }>(CREATE_ITEM_MUTATION, {
      variables: { 
        boardId, 
        itemName, 
        columnValues: columnValues ? JSON.stringify(columnValues) : undefined 
      }
    });
    return result.data.create_item;
  }
}

export function useMonday() {
  const [client, setClient] = useState<MondayGraphQLClient | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize client with environment variables
  useEffect(() => {
    const initializeClient = () => {
      try {
        // Get API keys from environment variables
        const mondayToken = import.meta.env.VITE_MONDAY_TOKEN;
        const mondayApiKey = import.meta.env.VITE_MONDAY_API_KEY;

        if (!mondayToken && !mondayApiKey) {
          console.warn('Monday.com credentials not found. Please set VITE_MONDAY_TOKEN or VITE_MONDAY_API_KEY');
          return;
        }

        const config: MondayConfig = {
          token: mondayToken,
          apiKey: mondayApiKey,
          apiVersion: '2023-10'
        };

        const newClient = new MondayGraphQLClient(config);
        setClient(newClient);
        setIsInitialized(true);
      } catch (error) {
        console.error('Failed to initialize Monday.com client:', error);
      }
    };

    initializeClient();
  }, []);

  // Hook state management
  const [boardsState, setBoardsState] = useState<MondayBoardsState>({
    loading: false,
    error: null,
    data: null
  });

  const [itemsState, setItemsState] = useState<MondayItemsState>({
    loading: false,
    error: null,
    data: null
  });

  const [workspacesState, setWorkspacesState] = useState<MondayWorkspacesState>({
    loading: false,
    error: null,
    data: null
  });

  const [usersState, setUsersState] = useState<MondayUsersState>({
    loading: false,
    error: null,
    data: null
  });

  // API Functions
  const getBoards = useCallback(async (limit: number = 25) => {
    if (!client) {
      setBoardsState({ loading: false, error: 'Client not initialized', data: null });
      return;
    }

    setBoardsState({ loading: true, error: null, data: null });
    
    try {
      const boards = await client.getBoards(limit);
      setBoardsState({ loading: false, error: null, data: boards });
      return boards;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch boards';
      setBoardsState({ loading: false, error: errorMessage, data: null });
      throw error;
    }
  }, [client]);

  const getItems = useCallback(async (boardId: string, limit: number = 50) => {
    if (!client) {
      setItemsState({ loading: false, error: 'Client not initialized', data: null });
      return;
    }

    setItemsState({ loading: true, error: null, data: null });
    
    try {
      const items = await client.getBoardItems(boardId, limit);
      setItemsState({ loading: false, error: null, data: items });
      return items;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch items';
      setItemsState({ loading: false, error: errorMessage, data: null });
      throw error;
    }
  }, [client]);

  const getWorkspaces = useCallback(async () => {
    if (!client) {
      setWorkspacesState({ loading: false, error: 'Client not initialized', data: null });
      return;
    }

    setWorkspacesState({ loading: true, error: null, data: null });
    
    try {
      const workspaces = await client.getWorkspaces();
      setWorkspacesState({ loading: false, error: null, data: workspaces });
      return workspaces;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch workspaces';
      setWorkspacesState({ loading: false, error: errorMessage, data: null });
      throw error;
    }
  }, [client]);

  const getUsers = useCallback(async () => {
    if (!client) {
      setUsersState({ loading: false, error: 'Client not initialized', data: null });
      return;
    }

    setUsersState({ loading: true, error: null, data: null });
    
    try {
      const users = await client.getUsers();
      setUsersState({ loading: false, error: null, data: users });
      return users;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch users';
      setUsersState({ loading: false, error: errorMessage, data: null });
      throw error;
    }
  }, [client]);

  const getMe = useCallback(async () => {
    if (!client) {
      throw new Error('Client not initialized');
    }

    try {
      return await client.getMe();
    } catch (error) {
      console.error('Failed to fetch user info:', error);
      throw error;
    }
  }, [client]);

  const createItem = useCallback(async (boardId: string, itemName: string, columnValues?: Record<string, any>) => {
    if (!client) {
      throw new Error('Client not initialized');
    }

    try {
      return await client.createItem(boardId, itemName, columnValues);
    } catch (error) {
      console.error('Failed to create item:', error);
      throw error;
    }
  }, [client]);

  return {
    // Client status
    isInitialized,
    client,

    // API Functions
    getBoards,
    getItems,
    getWorkspaces,
    getUsers,
    getMe,
    createItem,

    // State
    boards: boardsState,
    items: itemsState,
    workspaces: workspacesState,
    users: usersState,

    // Utility
    isLoading: boardsState.loading || itemsState.loading || workspacesState.loading || usersState.loading,
    hasErrors: !!(boardsState.error || itemsState.error || workspacesState.error || usersState.error),
    errors: {
      boards: boardsState.error,
      items: itemsState.error,
      workspaces: workspacesState.error,
      users: usersState.error,
    }
  };
}

export default useMonday;