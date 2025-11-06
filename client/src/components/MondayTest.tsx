import { useState } from 'react';
import { useMonday } from '@/hooks/useMonday';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, RefreshCw, Users, Folder, LayoutGrid, User } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export function MondayTest() {
  const monday = useMonday();
  const { toast } = useToast();
  const [selectedBoardId, setSelectedBoardId] = useState<string>('');

  const handleGetBoards = async () => {
    try {
      await monday.getBoards(10);
      toast({
        title: "Success",
        description: "Boards loaded successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to fetch boards",
        variant: "destructive",
      });
    }
  };

  const handleGetWorkspaces = async () => {
    try {
      await monday.getWorkspaces();
      toast({
        title: "Success",
        description: "Workspaces loaded successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to fetch workspaces",
        variant: "destructive",
      });
    }
  };

  const handleGetUsers = async () => {
    try {
      await monday.getUsers();
      toast({
        title: "Success",
        description: "Users loaded successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to fetch users",
        variant: "destructive",
      });
    }
  };

  const handleGetItems = async (boardId: string) => {
    if (!boardId) {
      toast({
        title: "Error",
        description: "Please select a board first",
        variant: "destructive",
      });
      return;
    }

    try {
      await monday.getItems(boardId, 20);
      toast({
        title: "Success",
        description: `Items loaded successfully for board ${boardId}`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to fetch items",
        variant: "destructive",
      });
    }
  };

  const handleGetMe = async () => {
    try {
      const me = await monday.getMe();
      toast({
        title: "Success",
        description: me ? `Hello ${me.name}!` : "User info retrieved",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to fetch user info",
        variant: "destructive",
      });
    }
  };

  if (!monday.isInitialized) {
    return (
      <Card className="w-full max-w-4xl mx-auto" data-testid="monday-test-loading">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Loader2 className="h-5 w-5 animate-spin" />
            Monday.com Integration Test
          </CardTitle>
          <CardDescription>
            Initializing Monday.com API client...
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Please wait while we initialize the connection to Monday.com API.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6" data-testid="monday-test-container">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <LayoutGrid className="h-5 w-5" />
            Monday.com API Integration Test
          </CardTitle>
          <CardDescription>
            Test the Monday.com API integration with your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2 mb-4">
            <Button 
              onClick={handleGetBoards} 
              disabled={monday.boards.loading}
              data-testid="button-get-boards"
            >
              {monday.boards.loading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Folder className="h-4 w-4 mr-2" />
              )}
              Get Boards
            </Button>
            
            <Button 
              onClick={handleGetWorkspaces} 
              disabled={monday.workspaces.loading}
              data-testid="button-get-workspaces"
            >
              {monday.workspaces.loading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <RefreshCw className="h-4 w-4 mr-2" />
              )}
              Get Workspaces
            </Button>
            
            <Button 
              onClick={handleGetUsers} 
              disabled={monday.users.loading}
              data-testid="button-get-users"
            >
              {monday.users.loading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Users className="h-4 w-4 mr-2" />
              )}
              Get Users
            </Button>
            
            <Button 
              onClick={handleGetMe} 
              variant="outline"
              data-testid="button-get-me"
            >
              <User className="h-4 w-4 mr-2" />
              Get Me
            </Button>
          </div>

          {monday.hasErrors && (
            <div className="mb-4 p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
              <h4 className="font-semibold text-destructive mb-2">Errors:</h4>
              {monday.errors.boards && <p className="text-sm text-destructive">Boards: {monday.errors.boards}</p>}
              {monday.errors.workspaces && <p className="text-sm text-destructive">Workspaces: {monday.errors.workspaces}</p>}
              {monday.errors.users && <p className="text-sm text-destructive">Users: {monday.errors.users}</p>}
              {monday.errors.items && <p className="text-sm text-destructive">Items: {monday.errors.items}</p>}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Boards Section */}
      {monday.boards.data && monday.boards.data.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Folder className="h-5 w-5" />
              Boards ({monday.boards.data.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {monday.boards.data.map((board) => (
                <Card 
                  key={board.id} 
                  className={`cursor-pointer transition-colors ${
                    selectedBoardId === board.id ? 'ring-2 ring-primary' : ''
                  }`}
                  onClick={() => setSelectedBoardId(board.id)}
                  data-testid={`board-card-${board.id}`}
                >
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">{board.name}</CardTitle>
                    <CardDescription className="text-xs">
                      ID: {board.id}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="space-y-2">
                      <Badge variant="outline" className="text-xs">
                        {board.board_kind}
                      </Badge>
                      {board.description && (
                        <p className="text-xs text-muted-foreground line-clamp-2">
                          {board.description}
                        </p>
                      )}
                      {selectedBoardId === board.id && (
                        <Button 
                          size="sm" 
                          className="w-full mt-2"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleGetItems(board.id);
                          }}
                          disabled={monday.items.loading}
                          data-testid={`button-get-items-${board.id}`}
                        >
                          {monday.items.loading ? (
                            <Loader2 className="h-3 w-3 animate-spin mr-1" />
                          ) : null}
                          Get Items
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Items Section */}
      {monday.items.data && monday.items.data.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <LayoutGrid className="h-5 w-5" />
              Items ({monday.items.data.length})
            </CardTitle>
            <CardDescription>
              Items from board: {selectedBoardId}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {monday.items.data.map((item) => (
                <div 
                  key={item.id} 
                  className="flex items-center justify-between p-3 border rounded-lg"
                  data-testid={`item-${item.id}`}
                >
                  <div>
                    <h4 className="font-medium">{item.name}</h4>
                    <p className="text-sm text-muted-foreground">ID: {item.id}</p>
                  </div>
                  {item.state && (
                    <Badge variant="secondary" className="text-xs">
                      {item.state}
                    </Badge>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Workspaces Section */}
      {monday.workspaces.data && monday.workspaces.data.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <RefreshCw className="h-5 w-5" />
              Workspaces ({monday.workspaces.data.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {monday.workspaces.data.map((workspace) => (
                <Card key={workspace.id} data-testid={`workspace-${workspace.id}`}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">{workspace.name}</CardTitle>
                    <CardDescription className="text-xs">
                      Kind: {workspace.kind} | ID: {workspace.id}
                    </CardDescription>
                  </CardHeader>
                  {workspace.description && (
                    <CardContent className="pt-0">
                      <p className="text-xs text-muted-foreground">
                        {workspace.description}
                      </p>
                    </CardContent>
                  )}
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Users Section */}
      {monday.users.data && monday.users.data.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Users ({monday.users.data.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {monday.users.data.slice(0, 9).map((user) => (
                <Card key={user.id} data-testid={`user-${user.id}`}>
                  <CardHeader className="pb-2">
                    <div className="flex items-center space-x-2">
                      {user.photo_original && (
                        <img 
                          src={user.photo_original} 
                          alt={user.name}
                          className="w-8 h-8 rounded-full"
                        />
                      )}
                      <div>
                        <CardTitle className="text-sm">{user.name}</CardTitle>
                        <CardDescription className="text-xs">
                          {user.email}
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="flex gap-1 flex-wrap">
                      {user.is_guest && <Badge variant="outline" className="text-xs">Guest</Badge>}
                      {user.is_pending && <Badge variant="outline" className="text-xs">Pending</Badge>}
                      {!user.enabled && <Badge variant="destructive" className="text-xs">Disabled</Badge>}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}