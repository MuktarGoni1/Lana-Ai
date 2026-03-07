"use client"
import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/db"
import { useToast } from "@/hooks/use-toast"
import { 
  Loader2, 
  User, 
  BookOpen, 
  GraduationCap, 
  ChevronLeft, 
  Plus, 
  Trash2, 
  Upload, 
  X,
  Edit2,
  Save,
  AlertTriangle
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { useUnifiedAuth } from "@/contexts/UnifiedAuthContext"
import { handleErrorWithReload, resetErrorHandler } from '@/lib/error-handler'

type Child = {
  id?: string;
  nickname: string;
  age: number | "";
  grade: string;
  isExisting?: boolean;
}

export default function ChildManagementPage() {
  const router = useRouter()
  const { toast } = useToast()
  const { user, isAuthenticated, isLoading: authLoading, registerChild } = useUnifiedAuth()
  const [children, setChildren] = useState<Child[]>([{ nickname: "", age: "", grade: "" }])
  const [existingChildren, setExistingChildren] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState<{[key: number]: {nickname: string, age: string, grade: string}}>({})
  const [csvFile, setCsvFile] = useState<File | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [initialSyncComplete, setInitialSyncComplete] = useState(false)
  const [editingChildId, setEditingChildId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<Child>({ nickname: "", age: "", grade: "" })
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)

  useEffect(() => {
    resetErrorHandler();
    if (authLoading) return;

    if (!isAuthenticated || !user) {
      router.push("/login");
      setInitialSyncComplete(true);
      return;
    }

    const userRole = user.user_metadata?.role;
    if (userRole !== 'guardian' && userRole !== 'parent') {
      router.push("/");
      setInitialSyncComplete(true);
      return;
    }

    loadExistingChildren();
    setInitialSyncComplete(true);
  }, [authLoading, isAuthenticated, router, user]);

  async function loadExistingChildren() {
    if (!user?.id) return;
    
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('parent_id', user.id)
      .eq('role', 'child')
      .eq('is_active', true)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('[Children] Error loading children:', error);
      return;
    }

    setExistingChildren(data || []);
  }

  const validateNickname = (value: string) => {
    if (!value.trim()) return "Nickname is required"
    if (value.trim().length < 2) return "Nickname must be at least 2 characters"
    return ""
  }

  const validateAge = (value: number | "") => {
    if (value === "") return "Age is required"
    if (typeof value === "number" && (value < 6 || value > 18)) return "Age must be between 6 and 18"
    return ""
  }

  const validateGrade = (value: string) => {
    if (!value) return "Grade is required"
    const validGrades = ['6', '7', '8', '9', '10', '11', '12', 'college']
    if (!validGrades.includes(value)) return "Invalid grade. Must be 6-12 or college"
    return ""
  }

  const validateChild = (index: number, child: Child) => {
    const nicknameError = validateNickname(child.nickname)
    const ageError = validateAge(child.age)
    const gradeError = validateGrade(child.grade)
    
    const childErrors = {
      nickname: nicknameError,
      age: ageError,
      grade: gradeError
    }
    
    setErrors(prev => ({
      ...prev,
      [index]: childErrors
    }))
    
    return !(nicknameError || ageError || gradeError)
  }

  const handleChildChange = (index: number, field: string, value: any) => {
    setChildren(prev => {
      const updated = [...prev]
      updated[index] = { ...updated[index], [field]: value }
      return updated
    })
    
    setErrors(prev => {
      if (prev[index]) {
        const updatedErrors = { ...prev }
        updatedErrors[index] = { ...updatedErrors[index], [field]: "" }
        return updatedErrors
      }
      return prev
    })
  }

  const addChild = () => {
    setChildren(prev => [...prev, { nickname: "", age: "", grade: "" }])
  }

  const removeChild = (index: number) => {
    if (children.length <= 1) {
      toast({
        title: "Cannot remove",
        description: "You must have at least one child in the form.",
        variant: "destructive",
      })
      return
    }
    
    setChildren(prev => prev.filter((_, i) => i !== index))
    setErrors(prev => {
      const updated = { ...prev }
      delete updated[index]
      const reindexed: typeof updated = {}
      Object.keys(updated).forEach((key, i) => {
        reindexed[i] = updated[Number(key)]
      })
      return reindexed
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    let hasErrors = false
    const newErrors: {[key: number]: {nickname: string, age: string, grade: string}} = {}
    
    children.forEach((child, index) => {
      const isValid = validateChild(index, child)
      if (!isValid) hasErrors = true
    })
    
    if (hasErrors) {
      toast({
        title: "Validation Error",
        description: "Please correct the errors in the form.",
        variant: "destructive",
      })
      return
    }

    setLoading(true)
    try {
      if (!user?.email) {
        toast({
          title: "Authentication Required",
          description: "Please log in again to continue with child registration.",
          variant: "destructive",
        })
        return router.push("/login")
      }

      for (const child of children) {
        const result = await registerChild(
          child.nickname,
          Number(child.age),
          child.grade,
          user.email
        )
        
        if (!result.success) {
          throw new Error(result.error || 'Failed to register child');
        }
      }

      toast({
        title: "Success",
        description: `Successfully added ${children.length} child${children.length > 1 ? 'ren' : ''}.`,
      })

      setChildren([{ nickname: "", age: "", grade: "" }]);
      await loadExistingChildren();
      
    } catch (err: unknown) {
      console.error('[ChildManagement] Unexpected error:', err);
      toast({
        title: "Registration Error",
        description: err instanceof Error ? err.message : "Failed to complete child registration. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const startEdit = (child: any) => {
    setEditingChildId(child.id);
    setEditForm({
      nickname: child.full_name || "",
      age: child.age || "",
      grade: child.grade?.toString() || "",
    });
  };

  const cancelEdit = () => {
    setEditingChildId(null);
    setEditForm({ nickname: "", age: "", grade: "" });
  };

  const saveEdit = async (childId: string) => {
    if (!editForm.nickname || !editForm.age || !editForm.grade) {
      toast({
        title: "Validation Error",
        description: "Please fill in all fields.",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: editForm.nickname,
          age: Number(editForm.age),
          grade: editForm.grade,
          updated_at: new Date().toISOString(),
        })
        .eq('id', childId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Child updated successfully.",
      });

      setEditingChildId(null);
      await loadExistingChildren();
    } catch (err) {
      console.error('[Children] Update error:', err);
      toast({
        title: "Update Failed",
        description: err instanceof Error ? err.message : "Could not update child.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async (childId: string) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ is_active: false })
        .eq('id', childId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Child removed successfully.",
      });

      setDeleteConfirmId(null);
      await loadExistingChildren();
    } catch (err) {
      console.error('[Children] Delete error:', err);
      toast({
        title: "Delete Failed",
        description: err instanceof Error ? err.message : "Could not remove child.",
        variant: "destructive",
      });
    }
  };

  const parseCsv = (csvText: string): { nickname: string; age: number; grade: string }[] => {
    const lines = csvText.trim().split('\n')
    const headers = lines[0].split(',').map(h => h.trim().toLowerCase())
    
    const requiredHeaders = ['nickname', 'age', 'grade']
    const missingHeaders = requiredHeaders.filter(header => !headers.includes(header))
    
    if (missingHeaders.length > 0) {
      throw new Error(`Missing required columns: ${missingHeaders.join(', ')}`)
    }
    
    const results = []
    
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim()
      if (!line) continue
      
      const values = line.split(',').map(v => v.trim())
      const row: any = {}
      
      headers.forEach((header, index) => {
        row[header] = values[index] || ''
      })
      
      if (!row.nickname || row.nickname.length < 2) {
        throw new Error(`Row ${i + 1}: Nickname must be at least 2 characters`)
      }
      
      const age = parseInt(row.age)
      if (isNaN(age) || age < 6 || age > 18) {
        throw new Error(`Row ${i + 1}: Age must be between 6 and 18`)
      }
      
      const validGrades = ['6', '7', '8', '9', '10', '11', '12', 'college']
      if (!validGrades.includes(row.grade)) {
        throw new Error(`Row ${i + 1}: Invalid grade. Must be 6-12 or college`)
      }
      
      results.push({
        nickname: row.nickname,
        age,
        grade: row.grade
      })
    }
    
    if (results.length === 0) {
      throw new Error('No valid data found in CSV file')
    }
    
    return results
  }

  const handleCsvImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    
    if (file.type !== 'text/csv' && !file.name.endsWith('.csv')) {
      toast({
        title: "Invalid file type",
        description: "Please upload a CSV file",
        variant: "destructive",
      })
      return
    }
    
    if (file.size > 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please upload a file smaller than 1MB",
        variant: "destructive",
      })
      return
    }
    
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const csvText = e.target?.result as string
        const parsedData = parseCsv(csvText)
        
        setChildren(parsedData.map(child => ({
          nickname: child.nickname,
          age: child.age,
          grade: child.grade
        })))
        
        setErrors({})
        
        toast({
          title: "Success",
          description: `Imported ${parsedData.length} children from CSV`
        })
      } catch (error: any) {
        toast({
          title: "CSV Import Failed",
          description: error.message,
          variant: "destructive",
        })
      }
    }
    
    reader.onerror = () => {
      toast({
        title: "Import Failed",
        description: "Failed to read the CSV file",
        variant: "destructive",
      })
    }
    
    reader.readAsText(file)
  }

  const triggerFileInput = () => {
    fileInputRef.current?.click()
  }

  if (!initialSyncComplete) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center px-4">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-white/10 border-t-white/30 rounded-full animate-spin mx-auto" />
          <p className="text-white/50">Loading child management...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center px-4 py-8">
      <div className="w-full max-w-2xl space-y-8">
        
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.back()}
            className="text-white/70 hover:text-white"
          >
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Manage Children</h1>
            <p className="text-white/50 text-sm">Add, edit or remove children</p>
          </div>
        </div>

        {/* Existing Children */}
        {existingChildren.length > 0 && (
          <section className="space-y-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <User className="w-5 h-5" />
              Your Children ({existingChildren.length})
            </h2>
            
            <div className="space-y-3">
              {existingChildren.map((child) => (
                <div 
                  key={child.id} 
                  className="p-4 rounded-xl bg-white/5 border border-white/10"
                >
                  {editingChildId === child.id ? (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-xs text-white/50 uppercase">Nickname</label>
                          <input
                            type="text"
                            value={editForm.nickname}
                            onChange={(e) => setEditForm({...editForm, nickname: e.target.value})}
                            className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-white/50 uppercase">Age</label>
                          <input
                            type="number"
                            min={6}
                            max={18}
                            value={editForm.age}
                            onChange={(e) => setEditForm({...editForm, age: e.target.value === "" ? "" : Number(e.target.value)})}
                            className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="text-xs text-white/50 uppercase">Grade</label>
                        <select
                          value={editForm.grade}
                          onChange={(e) => setEditForm({...editForm, grade: e.target.value})}
                          className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white"
                        >
                          <option value="">Select grade</option>
                          <option value="6">Grade 6</option>
                          <option value="7">Grade 7</option>
                          <option value="8">Grade 8</option>
                          <option value="9">Grade 9</option>
                          <option value="10">Grade 10</option>
                          <option value="11">Grade 11</option>
                          <option value="12">Grade 12</option>
                          <option value="college">College</option>
                        </select>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          onClick={() => saveEdit(child.id)}
                          disabled={saving}
                          size="sm"
                          className="bg-green-600 hover:bg-green-700"
                        >
                          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                          <span className="ml-2">Save</span>
                        </Button>
                        <Button
                          variant="outline"
                          onClick={cancelEdit}
                          size="sm"
                        >
                          <X className="w-4 h-4" />
                          <span className="ml-2">X</span>
                        </Button>
                      </div>
                    </div>
                  ) : deleteConfirmId === child.id ? (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-red-400">
                        <AlertTriangle className="w-5 h-5" />
                        <span className="font-medium">Confirm removal?</span>
                      </div>
                      <p className="text-sm text-white/60">
                        This will remove {child.full_name || 'this child'} from your account. You can re-add them later.
                      </p>
                      <div className="flex gap-2">
                        <Button
                          onClick={() => confirmDelete(child.id)}
                          size="sm"
                          className="bg-red-600 hover:bg-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                          <span className="ml-2">Yes, Remove</span>
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => setDeleteConfirmId(null)}
                          size="sm"
                        >
                          X
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium">{child.full_name || 'Unnamed'}</h3>
                        <p className="text-sm text-white/50">
                          Age {child.age} • Grade {child.grade}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => startEdit(child)}
                          className="text-white/50 hover:text-white"
                        >
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setDeleteConfirmId(child.id)}
                          className="text-red-400/50 hover:text-red-400"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Add New Children */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <section className="space-y-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Plus className="w-5 h-5" />
              Add New Child
            </h2>

            {/* CSV Import */}
            <div className="bg-white/[0.02] border border-white/10 rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-medium text-white/80">Bulk Import</h3>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={triggerFileInput}
                  className="px-3 py-1.5 text-xs border-white/20 text-white/70 hover:bg-white/10"
                >
                  <Upload className="w-3 h-3 mr-1" />
                  Import CSV
                </Button>
              </div>
              <p className="text-xs text-white/50 mb-3">
                Upload a CSV file with columns: nickname, age, grade
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,text/csv"
                onChange={handleCsvImport}
                className="hidden"
              />
            </div>

            {children.map((child, index) => (
              <div key={index} className="space-y-4 p-4 rounded-xl bg-white/[0.02] border border-white/10">
                {children.length > 1 && (
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-medium">Child {index + 1}</h3>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeChild(index)}
                      className="text-red-400 hover:text-red-300 hover:bg-red-400/10"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                )}
                
                <div className="space-y-2">
                  <label className="text-xs text-white/40 uppercase tracking-wider">Nickname</label>
                  <div className="relative">
                    <input
                      type="text"
                      value={child.nickname}
                      onChange={(e) => handleChildChange(index, 'nickname', e.target.value)}
                      placeholder="Enter child's nickname"
                      className={`w-full px-4 py-3 bg-white/[0.02] border rounded-lg text-white placeholder:text-white/30 focus:outline-none focus:bg-white/[0.03] transition-all pl-10 ${
                        errors[index] && errors[index].nickname ? "border-red-500" : "border-white/10 focus:border-white/30"
                      }`}
                      required
                    />
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-white/40" />
                  </div>
                  {errors[index] && errors[index].nickname && (
                    <p className="text-red-400 text-xs">{errors[index].nickname}</p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs text-white/40 uppercase tracking-wider">Age</label>
                    <div className="relative">
                      <input
                        type="number"
                        min={6}
                        max={18}
                        value={child.age || ""}
                        onChange={(e) => handleChildChange(index, 'age', e.target.value === "" ? "" : Number(e.target.value))}
                        placeholder="Age"
                        className={`w-full px-4 py-3 bg-white/[0.02] border rounded-lg text-white placeholder:text-white/30 focus:outline-none focus:bg-white/[0.03] transition-all pl-10 ${
                          errors[index] && errors[index].age ? "border-red-500" : "border-white/10 focus:border-white/30"
                        }`}
                        required
                      />
                      <GraduationCap className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-white/40" />
                    </div>
                    {errors[index] && errors[index].age && (
                      <p className="text-red-400 text-xs">{errors[index].age}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs text-white/40 uppercase tracking-wider">Grade</label>
                    <div className="relative">
                      <select
                        value={child.grade}
                        onChange={(e) => handleChildChange(index, 'grade', e.target.value)}
                        className={`w-full px-4 py-3 bg-white/[0.02] border rounded-lg text-white focus:outline-none focus:bg-white/[0.03] transition-all appearance-none cursor-pointer pl-10 pr-8 ${
                          errors[index] && errors[index].grade ? "border-red-500" : "border-white/10 focus:border-white/30"
                        }`}
                        required
                      >
                        <option value="" disabled className="bg-black text-white/50">Select</option>
                        <option value="6" className="bg-black">Grade 6</option>
                        <option value="7" className="bg-black">Grade 7</option>
                        <option value="8" className="bg-black">Grade 8</option>
                        <option value="9" className="bg-black">Grade 9</option>
                        <option value="10" className="bg-black">Grade 10</option>
                        <option value="11" className="bg-black">Grade 11</option>
                        <option value="12" className="bg-black">Grade 12</option>
                        <option value="college" className="bg-black">College</option>
                      </select>
                      <BookOpen className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-white/40" />
                    </div>
                    {errors[index] && errors[index].grade && (
                      <p className="text-red-400 text-xs">{errors[index].grade}</p>
                    )}
                  </div>
                </div>
              </div>
            ))}

            <Button
              type="button"
              onClick={addChild}
              variant="outline"
              className="w-full px-4 py-3 border border-white/20 text-white font-medium rounded-lg hover:bg-white/10 transition-all duration-200 flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Add Another Child
            </Button>
          </section>

          <div className="pt-4 space-y-3">
            <Button
              type="submit"
              className="w-full px-5 py-3.5 bg-white text-black font-medium text-sm rounded-lg hover:bg-white/95 transition-all duration-200 flex items-center justify-center"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Adding children...
                </>
              ) : (
                children.length === 1 ? "Add child" : `Add ${children.length} children`
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
