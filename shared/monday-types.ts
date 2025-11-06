// Monday.com API TypeScript interfaces

export interface MondayColumn {
  id: string;
  title: string;
  type: string;
  value?: any;
  text?: string;
}

export interface MondayItem {
  id: string;
  name: string;
  state?: string;
  column_values: MondayColumn[];
  created_at?: string;
  updated_at?: string;
  creator_id?: string;
  board?: {
    id: string;
    name: string;
  };
}

export interface MondayBoard {
  id: string;
  name: string;
  description?: string;
  board_kind: string;
  state: string;
  workspace_id?: string;
  items?: MondayItem[];
  columns?: MondayColumn[];
  groups?: MondayGroup[];
}

export interface MondayGroup {
  id: string;
  title: string;
  color: string;
  position: string;
  archived?: boolean;
}

export interface MondayWorkspace {
  id: string;
  name: string;
  kind: string;
  description?: string;
}

export interface MondayUser {
  id: string;
  name: string;
  email: string;
  url?: string;
  photo_original?: string;
  is_guest?: boolean;
  is_pending?: boolean;
  enabled?: boolean;
}

export interface MondayApiResponse<T> {
  data: T;
  errors?: Array<{
    message: string;
    locations?: Array<{
      line: number;
      column: number;
    }>;
    path?: string[];
  }>;
  account_id?: number;
}

export interface MondayQueryResponse {
  boards?: MondayBoard[];
  items?: MondayItem[];
  workspaces?: MondayWorkspace[];
  users?: MondayUser[];
  me?: MondayUser;
}

// Configuration interfaces
export interface MondayConfig {
  apiKey?: string;
  token?: string;
  apiVersion?: string;
  baseUrl?: string;
}

export interface MondayRequestOptions {
  variables?: Record<string, any>;
  operationName?: string;
}

// Hook response interfaces
export interface MondayHookState {
  loading: boolean;
  error: string | null;
  data: any;
}

export interface MondayBoardsState extends MondayHookState {
  data: MondayBoard[] | null;
}

export interface MondayItemsState extends MondayHookState {
  data: MondayItem[] | null;
}

export interface MondayWorkspacesState extends MondayHookState {
  data: MondayWorkspace[] | null;
}

export interface MondayUsersState extends MondayHookState {
  data: MondayUser[] | null;
}