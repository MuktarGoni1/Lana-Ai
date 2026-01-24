'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/db';
import { Button } from '@/components/ui/button';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { User, Users, Eye } from 'lucide-react';

export default function ParentSwitcher() {
  const { user, role, isParent } = useAuth();
  const [children, setChildren] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchChildren = async () => {
      if (!isParent || !user?.id) {
        setChildren([]);
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await (supabase as any)
          .from('profiles')
          .select('id, full_name, role')
          .eq('parent_id', user.id);

        if (error) throw error;

        setChildren(data || []);
      } catch (error) {
        console.error('Error fetching children for switcher:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchChildren();
  }, [isParent, user?.id]);

  if (!isParent || loading) {
    return null;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="flex items-center gap-2">
          <Users className="w-4 h-4" />
          <span>Switch View</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56 bg-gray-800 border-gray-700">
        <DropdownMenuItem className="cursor-default bg-gray-900/50" disabled>
          <User className="w-4 h-4 mr-2" />
          Parent View
        </DropdownMenuItem>
        
        {children.length > 0 ? (
          children.map((child) => (
            <DropdownMenuItem 
              key={child.id}
              className="cursor-pointer"
              onClick={() => {
                // In a real implementation, this would switch the view context
                // For now, just log the action
                console.log('Switching to child view:', child.id);
              }}
            >
              <Eye className="w-4 h-4 mr-2" />
              <div>
                <div className="font-medium">{child.full_name}</div>
                <div className="text-xs text-gray-400">View as child</div>
              </div>
            </DropdownMenuItem>
          ))
        ) : (
          <DropdownMenuItem disabled className="text-gray-500">
            No children linked
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}