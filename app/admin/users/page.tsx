"use client";

import DeleteConfirmationModal from "@/components/admin/DeleteConfirmationModal";
import EditUserModal from "@/components/admin/EditUserModal";
import HybridSearchInput from "@/components/admin/HybridSearchInput";
import SortingControls from "@/components/admin/SortingControls";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useHybridSearch } from "@/hooks/useHybridSearch";
import { useSorting } from "@/hooks/useSorting";
import defaultInstance, { defaultInstance as axios } from "@/http";
import { Test, type User } from "@/types/db";
import {
  Calendar,
  Edit,
  RefreshCw,
  Trash2,
  User as UserIcon,
  UserPlus,
  Users,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

interface UsersResponse {
  success: boolean;
  users: User[];
  total: number;
  offset: number;
  limit: number;
  search: string;
}

export default function AdminUsersPage() {
  const [newUserFullName, setNewUserFullName] = useState("");
  const [newUserEmail, setNewUserEmail] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState("");
  const [tests, setTests] = useState<Test[]>([]);
  const [loadingUserId, setLoadingUserId] = useState<string | null>(null);
  const [operationInProgress, setOperationInProgress] = useState<Set<string>>(
    new Set()
  );

  // Modal states
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isBulkDeleteModalOpen, setIsBulkDeleteModalOpen] = useState(false);
  const [deletingUser, setDeletingUser] = useState<User | null>(null);
  const [isDeletingUser, setIsDeletingUser] = useState(false);
  const [isDeletingBulk, setIsDeletingBulk] = useState(false);

  // Selection state
  const [selectedUserIds, setSelectedUserIds] = useState<Set<string>>(
    new Set()
  );

  // Search function for server-side search
  const searchUsers = useCallback(
    async (query: string, offset: number, limit: number) => {
      const response = await axios.get<UsersResponse>("/api/users", {
        params: {
          search: query,
          offset,
          limit,
        },
      });

      if (!response.data.success) {
        throw new Error("Failed to fetch users");
      }

      return {
        items: response.data.users || [],
        total: response.data.total || 0,
        offset: response.data.offset || 0,
        limit: response.data.limit || limit,
      };
    },
    []
  );

  // Local filter function for immediate filtering
  const localFilterUsers = useCallback((users: User[], query: string) => {
    if (!query.trim()) return users;

    const searchLower = query.toLowerCase();
    return users.filter(
      (user) =>
        user.id?.toLowerCase().includes(searchLower) ||
        user.full_name?.toLowerCase().includes(searchLower) ||
        user.email?.toLowerCase().includes(searchLower)
    );
  }, []);

  // Use the hybrid search hook
  const {
    items: users,
    localItems: localUsers,
    total,
    currentPage,
    totalPages,
    searchQuery,
    isSearching,
    hasSearchResults,
    isLoading,
    isLocalFiltering,
    setSearchQuery,
    setCurrentPage,
    refresh,
    clearSearch,
  } = useHybridSearch({
    searchFn: searchUsers,
    localFilterFn: localFilterUsers,
    debounceMs: 400,
    itemsPerPage: 10,
  });

  // Use local results if searching, otherwise use server results
  const displayUsers =
    hasSearchResults && localUsers.length >= 0 ? localUsers : users;

  // Sorting functionality
  const {
    sortedData: sortedUsers,
    sortConfig,
    handleSort,
    clearSort,
  } = useSorting({
    data: displayUsers,
    defaultSort: { key: "full_name", direction: "asc", label: "Name" },
    sortFunctions: {
      created_at: (a: User, b: User, direction) => {
        const aDate = new Date(a.created_at).getTime();
        const bDate = new Date(b.created_at).getTime();
        const comparison = aDate - bDate;
        return direction === "asc" ? comparison : -comparison;
      },
    },
  });

  const sortOptions = [
    { key: "full_name", label: "Name", icon: <UserIcon className="h-4 w-4" /> },
    {
      key: "created_at",
      label: "Created Date",
      icon: <Calendar className="h-4 w-4" />,
    },
  ];

  useEffect(() => {
    loadTests();
  }, []);

  const assignTestToUser = useCallback(
    async (userId: string, testId: string) => {
      if (operationInProgress.has(userId)) return;

      try {
        setOperationInProgress((prev) => new Set(prev).add(userId));
        setLoadingUserId(userId);
        const adminSession = JSON.parse(
          sessionStorage.getItem("adminSession") || '{"id": ""}'
        );
        const res = await defaultInstance.post(
          "/api/admin/assign-test-to-user",
          {
            user_id: userId,
            test_id: testId,
            admin_id: adminSession.id,
          }
        );
        if (res.data.success) {
          toast.success("Test assigned successfully");
          // Use requestAnimationFrame to avoid DOM conflicts
          await new Promise((resolve) => requestAnimationFrame(resolve));
          await refresh();
        } else {
          setError(res.data.message || "Failed to assign test");
          toast.error("Failed to assign test");
        }
      } catch (err: any) {
        console.error("Assign test error:", err);
        setError("Failed to assign test. Please try again.");
        toast.error("Failed to assign test");
      } finally {
        setLoadingUserId(null);
        setOperationInProgress((prev) => {
          const newSet = new Set(prev);
          newSet.delete(userId);
          return newSet;
        });
      }
    },
    [refresh, operationInProgress]
  );

  const removeTestFromUser = useCallback(
    async (userId: string, testId: string) => {
      if (operationInProgress.has(userId)) return;

      try {
        setOperationInProgress((prev) => new Set(prev).add(userId));
        setLoadingUserId(userId);
        const res = await defaultInstance.delete(
          `/api/user-assigned-tests/${userId}/${testId}`
        );
        if (res.data.success) {
          toast.success("Test assignment removed");
          // Use requestAnimationFrame to avoid DOM conflicts
          await new Promise((resolve) => requestAnimationFrame(resolve));
          await refresh();
        } else {
          toast.error("Failed to remove test assignment");
        }
      } catch (err: any) {
        console.error("Remove test assignment error:", err);
        setError("Failed to remove test assignment. Please try again.");
        toast.error("Failed to remove test assignment");
      } finally {
        setLoadingUserId(null);
        setOperationInProgress((prev) => {
          const newSet = new Set(prev);
          newSet.delete(userId);
          return newSet;
        });
      }
    },
    [refresh, operationInProgress]
  );

  const handleTestAssignmentChange = useCallback(
    async (userId: string, currentTestId: string | null, newValue: string) => {
      // Prevent multiple concurrent operations for the same user
      if (operationInProgress.has(userId)) return;

      // Prevent refresh during operation to avoid DOM conflicts
      const originalRefresh = refresh;
      const safeRefresh = async () => {
        await new Promise((resolve) => requestAnimationFrame(resolve));
        await originalRefresh();
      };

      try {
        if (newValue === "none" && currentTestId) {
          await removeTestFromUser(userId, currentTestId);
        } else if (newValue !== "none" && newValue !== currentTestId) {
          await assignTestToUser(userId, newValue);
        }
      } catch (error) {
        console.error("Test assignment change error:", error);
      }
    },
    [assignTestToUser, removeTestFromUser, operationInProgress, refresh]
  );

  const loadTests = async () => {
    try {
      const response = await axios.get("/api/tests");
      if (response.data.success) {
        setTests(response.data.tests || []);
      }
    } catch (error: any) {
      console.error("Load tests error:", error);
      setError("Failed to load tests. Some features may not work properly.");
    }
  };

  const createUser = async () => {
    if (!newUserFullName.trim() || !newUserEmail.trim()) {
      setError("Please fill in all fields");
      return;
    }

    try {
      setIsCreating(true);
      setError("");

      const res = await defaultInstance.post("/api/users", {
        full_name: newUserFullName.trim(),
        email: newUserEmail.trim(),
      });

      const data = await res.data;

      if (data.success) {
        setNewUserFullName("");
        setNewUserEmail("");
        toast.success("User created successfully");
        await refresh();
      } else {
        setError(data.message || data.msg || "Failed to create user");
        toast.error("Failed to create user");
      }
    } catch (err: any) {
      console.error("Create user error:", err);
      setError(
        err.response?.data?.message ||
          err?.response?.data?.msg ||
          "Failed to create user. Please try again."
      );
      toast.error(
        err.response?.data?.message ||
          err?.response?.data?.msg ||
          "Failed to create user. Please try again."
      );
    } finally {
      setIsCreating(false);
    }
  };

  const handleEditUser = (user: User) => {
    setEditingUser(user);
    setIsEditModalOpen(true);
  };

  const handleSaveUser = async (
    userId: string,
    userData: { full_name: string; email: string; id: string }
  ) => {
    try {
      const res = await defaultInstance.put(
        `/api/admin/users/${userId}`,
        userData
      );
      if (res.data.success) {
        toast.success("User updated successfully");
        await refresh();
      } else {
        toast.error(res.data.error || "Failed to update user");
        throw new Error(res.data.error);
      }
    } catch (err: any) {
      console.error("Update user error:", err);
      toast.error("Failed to update user");
      throw err;
    }
  };

  const handleDeleteUser = (user: User) => {
    setDeletingUser(user);
    setIsDeleteModalOpen(true);
  };

  const confirmDeleteUser = async () => {
    if (!deletingUser) return;

    try {
      setIsDeletingUser(true);
      const res = await defaultInstance.delete(
        `/api/admin/users/${deletingUser.id}`
      );
      if (res.data.success) {
        toast.success("User deleted successfully");
        await refresh();
      } else {
        toast.error(res.data.error || res.data.msg || "Failed to delete user");
      }
    } catch (err: any) {
      console.error("Delete user error:", err);
      toast.error("Failed to delete user");
    } finally {
      setIsDeletingUser(false);
      setDeletingUser(null);
    }
  };

  const handleBulkDelete = () => {
    if (selectedUserIds.size === 0) {
      toast.error("Please select users to delete");
      return;
    }
    setIsBulkDeleteModalOpen(true);
  };

  const confirmBulkDelete = async () => {
    if (selectedUserIds.size === 0) return;

    try {
      setIsDeletingBulk(true);
      const res = await defaultInstance.delete("/api/admin/users", {
        data: { userIds: Array.from(selectedUserIds) },
      });
      if (res.data.success) {
        toast.success(`${selectedUserIds.size} users deleted successfully`);
        setSelectedUserIds(new Set());
        await refresh();
      } else {
        toast.error(res.data.error || "Failed to delete users");
      }
    } catch (err: any) {
      console.error("Bulk delete users error:", err);
      toast.error("Failed to delete users");
    } finally {
      setIsDeletingBulk(false);
    }
  };

  const handleSelectUser = (userId: string, selected: boolean) => {
    setSelectedUserIds((prev) => {
      const newSet = new Set(prev);
      if (selected) {
        newSet.add(userId);
      } else {
        newSet.delete(userId);
      }
      return newSet;
    });
  };

  const handleSelectAll = (selected: boolean) => {
    if (selected) {
      setSelectedUserIds(new Set(sortedUsers.map((user) => user.id)));
    } else {
      setSelectedUserIds(new Set());
    }
  };

  // Calculate stats
  const allUsersForStats = hasSearchResults ? localUsers : users;
  const totalUsersForStats = hasSearchResults ? localUsers.length : total;
  const usersWithTests = allUsersForStats.filter((user) => user.active_test_id);
  const isAllSelected =
    sortedUsers.length > 0 &&
    sortedUsers.every((user) => selectedUserIds.has(user.id));
  const isPartiallySelected = selectedUserIds.size > 0 && !isAllSelected;

  // Only show skeleton loading on initial page load, not during search
  if (isLoading) {
    return (
      <div className="container mx-auto py-6">
        <div className="space-y-6">
          <h1 className="text-3xl font-bold">Users Management</h1>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Users Management</h1>
        <div className="flex items-center gap-2">
          <Button onClick={refresh} variant="outline" disabled={isSearching}>
            <RefreshCw
              className={`h-4 w-4 mr-2 ${isSearching ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Users className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm font-medium text-gray-600">
                  {hasSearchResults ? "Search Results" : "Total Users"}
                </p>
                <p className="text-2xl font-bold">{totalUsersForStats}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <UserPlus className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm font-medium text-gray-600">With Tests</p>
                <p className="text-2xl font-bold">{usersWithTests.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Users className="h-5 w-5 text-orange-600" />
              <div>
                <p className="text-sm font-medium text-gray-600">Selected</p>
                <p className="text-2xl font-bold">{selectedUserIds.size}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Create User Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Create New User
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="fullName">Full Name</Label>
              <Input
                id="fullName"
                value={newUserFullName}
                onChange={(e) => setNewUserFullName(e.target.value)}
                placeholder="Enter full name"
                disabled={isCreating}
              />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={newUserEmail}
                onChange={(e) => setNewUserEmail(e.target.value)}
                placeholder="Enter email address"
                disabled={isCreating}
              />
            </div>
          </div>

          <Button
            onClick={createUser}
            disabled={isCreating}
            className="w-full md:w-auto"
          >
            {isCreating ? "Creating..." : "Create User"}
          </Button>
        </CardContent>
      </Card>

      {/* Search and Sorting Controls */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1">
          <Card>
            <CardContent className="p-4">
              <HybridSearchInput
                placeholder="Search by ID, name, or email..."
                searchQuery={searchQuery}
                isSearching={isSearching}
                isLocalFiltering={isLocalFiltering}
                hasSearchResults={hasSearchResults}
                localResultsCount={localUsers.length}
                onSearchChange={setSearchQuery}
                onClearSearch={clearSearch}
              />
            </CardContent>
          </Card>
        </div>
        <Card>
          <CardContent className="p-4">
            <SortingControls
              sortOptions={sortOptions}
              currentSort={sortConfig}
              onSort={handleSort}
              onClearSort={clearSort}
            />
          </CardContent>
        </Card>
      </div>

      {/* Users List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Users List
            {hasSearchResults && (
              <Badge variant="secondary">
                {localUsers.length} search results
              </Badge>
            )}
            {sortConfig && (
              <Badge variant="outline">Sorted by {sortConfig.label}</Badge>
            )}
            {selectedUserIds.size > 0 && (
              <Button
                variant="destructive"
                size="sm"
                onClick={handleBulkDelete}
                disabled={isDeletingBulk}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Selected ({selectedUserIds.size})
              </Button>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {sortedUsers.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">
                {hasSearchResults
                  ? "No users found for your search."
                  : "No users available."}
              </p>
              {hasSearchResults && (
                <Button
                  variant="outline"
                  onClick={clearSearch}
                  className="mt-2"
                >
                  Clear search
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {/* Select All Checkbox */}
              <div className="flex items-center gap-2 p-2 border-b">
                <Checkbox
                  checked={isAllSelected}
                  ref={(el: any) => {
                    if (el) el.indeterminate = isPartiallySelected;
                  }}
                  onCheckedChange={handleSelectAll}
                />
                <span className="text-sm text-gray-600">
                  {isAllSelected ? "Deselect All" : "Select All"} (
                  {sortedUsers.length} items)
                </span>
              </div>

              {sortedUsers.map((user) => (
                <Card
                  key={`user-${user.id}-${user.active_test_id || "none"}`}
                  className="p-4"
                >
                  <div className="flex items-center gap-4">
                    {/* Selection Checkbox */}
                    <Checkbox
                      checked={selectedUserIds.has(user.id)}
                      onCheckedChange={(checked) =>
                        handleSelectUser(user.id, checked as boolean)
                      }
                    />

                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold">{user.full_name}</h3>
                        <Badge variant="outline">{user.role}</Badge>
                      </div>
                      <p className="text-sm text-gray-600">{user.email}</p>
                      <p className="text-xs text-gray-500">ID: {user.id}</p>
                      <p className="text-xs text-gray-400">
                        Created:{" "}
                        {new Date(user.created_at).toLocaleDateString()}
                      </p>
                    </div>

                    <div className="flex flex-col gap-2">
                      {/* Edit and Delete Buttons */}
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditUser(user)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteUser(user)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>

                      {/* Test Assignment */}
                      <div className="flex items-center gap-2">
                        <Label htmlFor={`test-${user.id}`} className="text-sm">
                          Test:
                        </Label>
                        <Select
                          key={user.id}
                          value={
                            operationInProgress.has(user.id)
                              ? user.active_test_id || "none"
                              : user.active_test_id || "none"
                          }
                          onValueChange={(value) => {
                            if (!operationInProgress.has(user.id)) {
                              handleTestAssignmentChange(
                                user.id,
                                user.active_test_id,
                                value
                              );
                            }
                          }}
                          disabled={
                            loadingUserId === user.id ||
                            operationInProgress.has(user.id)
                          }
                        >
                          <SelectTrigger className="w-48">
                            <SelectValue
                              placeholder={
                                loadingUserId === user.id
                                  ? "Loading..."
                                  : "Select a test"
                              }
                            />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">
                              No test assigned
                            </SelectItem>
                            {tests.map((test) => (
                              <SelectItem key={test.id} value={test.id}>
                                {test.title} ({test.edition})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}

              {/* Pagination - only show for server results, not local search */}
              {!hasSearchResults && totalPages > 1 && (
                <div className="flex justify-center mt-6">
                  <Pagination>
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious
                          onClick={() =>
                            setCurrentPage(Math.max(1, currentPage - 1))
                          }
                          className={
                            currentPage === 1
                              ? "pointer-events-none opacity-50"
                              : "cursor-pointer"
                          }
                        />
                      </PaginationItem>

                      {[...Array(Math.min(5, totalPages))].map((_, i) => {
                        const pageNum =
                          Math.max(
                            1,
                            Math.min(totalPages - 4, currentPage - 2)
                          ) + i;
                        if (pageNum <= totalPages) {
                          return (
                            <PaginationItem key={pageNum}>
                              <PaginationLink
                                onClick={() => setCurrentPage(pageNum)}
                                isActive={pageNum === currentPage}
                                className="cursor-pointer"
                              >
                                {pageNum}
                              </PaginationLink>
                            </PaginationItem>
                          );
                        }
                        return null;
                      })}

                      <PaginationItem>
                        <PaginationNext
                          onClick={() =>
                            setCurrentPage(
                              Math.min(totalPages, currentPage + 1)
                            )
                          }
                          className={
                            currentPage === totalPages
                              ? "pointer-events-none opacity-50"
                              : "cursor-pointer"
                          }
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit User Modal */}
      <EditUserModal
        user={editingUser}
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setEditingUser(null);
        }}
        onSave={handleSaveUser}
      />

      {/* Delete User Modal */}
      <DeleteConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setDeletingUser(null);
        }}
        onConfirm={confirmDeleteUser}
        title="Delete User"
        description={`Are you sure you want to delete user "${deletingUser?.full_name}"?`}
        warningMessage="This will also delete all of the user's exam results and test assignments."
        isLoading={isDeletingUser}
      />

      {/* Bulk Delete Modal */}
      <DeleteConfirmationModal
        isOpen={isBulkDeleteModalOpen}
        onClose={() => setIsBulkDeleteModalOpen(false)}
        onConfirm={confirmBulkDelete}
        title="Delete Multiple Users"
        description="Are you sure you want to delete the selected users?"
        warningMessage="This will also delete all selected users' exam results and test assignments."
        itemCount={selectedUserIds.size}
        isLoading={isDeletingBulk}
      />
    </div>
  );
}
