import { useState } from 'react';
import { Users, Plus, Trash2, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import {
  useListFamilyMembers,
  useCreateFamilyMember,
  useDeleteFamilyMember,
  useGetAllRecords,
} from '../hooks/useQueries';

const MAX_FAMILY_MEMBERS = 8;

function FamilyMemberCard({ profileId, name }: { profileId: string; name: string }) {
  const deleteMember = useDeleteFamilyMember();
  const { data: records = [] } = useGetAllRecords(profileId);

  const handleDelete = async () => {
    try {
      await deleteMember.mutateAsync(profileId);
      toast.success(`${name} and their records have been removed`);
    } catch {
      toast.error('Failed to delete family member');
    }
  };

  return (
    <Card className="medical-card">
      <CardContent className="flex items-center justify-between p-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
            <span className="text-primary font-semibold text-sm">
              {name.charAt(0).toUpperCase()}
            </span>
          </div>
          <div>
            <p className="font-medium">{name}</p>
            <p className="text-xs text-muted-foreground">
              {records.length} record{records.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs">
            {records.length} records
          </Badge>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                disabled={deleteMember.isPending}
              >
                {deleteMember.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4" />
                )}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete {name}?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently delete {name}'s profile and all {records.length} associated
                  medical record{records.length !== 1 ? 's' : ''}. This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDelete}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </CardContent>
    </Card>
  );
}

export default function FamilyMembersPage() {
  const [newName, setNewName] = useState('');
  const { data: familyMembers = [], isLoading } = useListFamilyMembers();
  const createMember = useCreateFamilyMember();

  const atLimit = familyMembers.length >= MAX_FAMILY_MEMBERS;

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    if (atLimit) {
      toast.error(`Maximum of ${MAX_FAMILY_MEMBERS} family members reached`);
      return;
    }
    try {
      await createMember.mutateAsync(newName.trim());
      toast.success(`${newName.trim()} added to your family`);
      setNewName('');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to add family member';
      toast.error(msg);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <Users className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground">Family Members</h1>
          <p className="text-sm text-muted-foreground">
            Manage health profiles for up to {MAX_FAMILY_MEMBERS} family members
          </p>
        </div>
      </div>

      {/* Add new member */}
      <Card className="shadow-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Add Family Member</CardTitle>
        </CardHeader>
        <CardContent>
          {atLimit && (
            <div className="flex items-center gap-2 p-3 mb-3 rounded-lg bg-warning/10 border border-warning/20 text-sm">
              <AlertCircle className="h-4 w-4 text-warning shrink-0" />
              <span>You've reached the maximum of {MAX_FAMILY_MEMBERS} family members.</span>
            </div>
          )}
          <form onSubmit={handleAdd} className="flex gap-2">
            <div className="flex-1">
              <Label htmlFor="new-member" className="sr-only">
                Name
              </Label>
              <Input
                id="new-member"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Enter name (e.g. Mom, Dad, Child)"
                disabled={atLimit || createMember.isPending}
              />
            </div>
            <Button
              type="submit"
              disabled={atLimit || createMember.isPending || !newName.trim()}
            >
              {createMember.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Plus className="h-4 w-4" />
              )}
              <span className="ml-1">Add</span>
            </Button>
          </form>
          <p className="text-xs text-muted-foreground mt-2">
            {familyMembers.length} / {MAX_FAMILY_MEMBERS} profiles used
          </p>
        </CardContent>
      </Card>

      {/* Members list */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <Skeleton key={i} className="h-20 w-full rounded-lg" />
          ))}
        </div>
      ) : familyMembers.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Users className="h-12 w-12 text-muted-foreground/30 mb-3" />
          <p className="text-muted-foreground">No family members added yet.</p>
          <p className="text-sm text-muted-foreground mt-1">
            Add a family member above to track their health records separately.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {familyMembers.map((m) => (
            <FamilyMemberCard key={m.profileId} profileId={m.profileId} name={m.name} />
          ))}
        </div>
      )}
    </div>
  );
}
