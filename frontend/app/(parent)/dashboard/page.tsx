'use client';

import { useState, useEffect } from 'react';
import { useUnifiedAuth } from '@/contexts/UnifiedAuthContext';
import { supabase } from '@/lib/db';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { useRouter } from 'next/navigation';
import { Plus, User, BarChart3, Settings } from 'lucide-react';

export default function ParentDashboard() {
  const { user } = useUnifiedAuth();
  const router = useRouter();
  const [children, setChildren] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchChildren = async () => {
      if (!user?.id) return;
      
      try {
        const { data, error } = await (supabase as any)
          .from('profiles')
          .select('*')
          .eq('parent_id', user.id);
        
        if (error) throw error;
        
        setChildren(data || []);
      } catch (error) {
        console.error('Error fetching children:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchChildren();
  }, [user]);

  const handleAddChild = () => {
    router.push('/onboarding'); // Take parent to onboarding to add a child
  };

  const handleViewChild = (childId: string) => {
    // In a real implementation, this might switch the view context
    // or navigate to a child-specific area
    console.log('Viewing child:', childId);
  };

  return (
    <div className="min-h-screen bg-black text-white p-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Parent Dashboard</h1>
          <p className="text-gray-400">Manage your children's learning experience</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="bg-gray-900 border-gray-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                Children
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{children.length}</p>
              <p className="text-gray-400">Total Accounts</p>
            </CardContent>
          </Card>

          <Card className="bg-gray-900 border-gray-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                Progress
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">0%</p>
              <p className="text-gray-400">Avg. Completion</p>
            </CardContent>
          </Card>

          <Card className="bg-gray-900 border-gray-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5" />
                Settings
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">1</p>
              <p className="text-gray-400">Account</p>
            </CardContent>
          </Card>
        </div>

        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold">Your Children</h2>
          <Button onClick={handleAddChild} className="bg-blue-600 hover:bg-blue-700">
            <Plus className="w-4 h-4 mr-2" />
            Add Child
          </Button>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : children.length === 0 ? (
          <Card className="bg-gray-900 border-gray-800">
            <CardContent className="p-8 text-center">
              <User className="w-12 h-12 text-gray-600 mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No children added yet</h3>
              <p className="text-gray-400 mb-4">Add your first child to start tracking their progress</p>
              <Button onClick={handleAddChild} className="bg-blue-600 hover:bg-blue-700">
                Add Child
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {children.map((child) => (
              <Card 
                key={child.id} 
                className="bg-gray-900 border-gray-800 hover:bg-gray-800 transition-colors cursor-pointer"
                onClick={() => handleViewChild(child.id)}
              >
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="w-5 h-5 text-blue-400" />
                    {child.full_name || 'Child Account'}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-400 text-sm">Role: {child.role}</p>
                  <p className="text-gray-400 text-sm">Created: {new Date(child.created_at).toLocaleDateString()}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}