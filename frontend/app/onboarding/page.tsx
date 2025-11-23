"use client"
import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/db"
import { useToast } from "@/hooks/use-toast"
import { Loader2, User, BookOpen, GraduationCap, ChevronLeft, ArrowRight, Plus, Trash2, Upload } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { InsertUser, InsertGuardian } from "@/types/supabase"
import { skipToHomepage } from "@/lib/navigation"
import { AuthService } from "@/lib/services/authService"

export default function OnboardingPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [children, setChildren] = useState([{ nickname: "", age: "" as number | "", grade: "" }])
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<{[key: number]: {nickname: string, age: string, grade: string}}>({})
  const [csvFile, setCsvFile] = useState<File | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const authService = new AuthService()
  
  // Check for and sync local children data when component mounts
  useEffect(() => {
    const syncLocalChildren = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user?.email) {
          // Check if there are local children to sync
          const localChildren = authService.getLocalChildren();
          if (localChildren.length > 0) {
            toast({
              title: "Syncing Local Data",
              description: `Found ${localChildren.length} children saved locally. Syncing with account...`,
            });
            
            // Try to sync local children
            const result = await authService.linkLocalChildrenToAccount(session.user.email);
            
            if (result.success) {
              toast({
                title: "Sync Complete",
                description: result.message,
              });
            } else {
              toast({
                title: "Sync Partially Failed",
                description: result.message,
                variant: "destructive",
              });
            }
          }
        }
      } catch (error) {
        console.error('[Onboarding] Error syncing local children:', error);
      }
    };
    
    syncLocalChildren();
  }, []);

  // Validation functions
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
    return ""
  }

  const validateChild = (index: number, child: {nickname: string, age: number | "", grade: string}) => {
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
    
    // Clear error for this field when user starts typing
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
    setChildren(prev => [...prev, { nickname: "", age: "" as number | "", grade: "" }])
  }

  const removeChild = (index: number) => {
    if (children.length <= 1) {
      toast({
        title: "Cannot remove",
        description: "You must have at least one child.",
        variant: "destructive",
      })
      return
    }
    
    setChildren(prev => prev.filter((_, i) => i !== index))
    setErrors(prev => {
      const updated = { ...prev }
      delete updated[index]
      // Reindex errors
      const reindexed: typeof updated = {}
      Object.keys(updated).forEach((key, i) => {
        reindexed[i] = updated[Number(key)]
      })
      return reindexed
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    console.log('[Onboarding] Starting child registration process');
    console.log('[Onboarding] Form data:', children);
    
    // Validate all children
    let hasErrors = false
    const newErrors: {[key: number]: {nickname: string, age: string, grade: string}} = {}
    
    children.forEach((child, index) => {
      const isValid = validateChild(index, child)
      if (!isValid) hasErrors = true
    })
    
    if (hasErrors) {
      console.warn('[Onboarding] Validation failed');
      toast({
        title: "Validation Error",
        description: "Please correct the errors in the form.",
        variant: "destructive",
      })
      return
    }

    setLoading(true)
    try {
      console.log('[Onboarding] Getting user session');
      const { data: { session } } = await supabase.auth.getSession()
      console.log('[Onboarding] Session status:', session ? 'Active' : 'None');
      
      if (!session) {
        console.error('[Onboarding] No session found, redirecting to login');
        toast({
          title: "Authentication Required",
          description: "Please log in again to continue with child registration.",
          variant: "destructive",
        })
        return router.push("/login")
      }

      // Register children using the enhanced AuthService
      console.log('[Onboarding] Registering children');
      let result
      
      try {
        if (children.length === 1) {
          // Single child registration
          const child = children[0]
          result = await authService.registerChild(
            child.nickname,
            Number(child.age),
            child.grade,
            session.user.email!
          )
        } else {
          // Bulk child registration
          const childrenData = children.map(child => ({
            nickname: child.nickname,
            age: Number(child.age),
            grade: child.grade
          }))
          result = await authService.registerMultipleChildren(childrenData, session.user.email!)
        }
        
        // Handle offline scenario
        if (result && !result.success && result.offline) {
          toast({
            title: "Offline Mode",
            description: result.message,
          })
          // Still redirect to term-plan to continue onboarding
          console.log('[Onboarding] Redirecting to term-plan in offline mode');
          router.push("/term-plan?onboarding=1")
          return;
        }
        
        if (!result.success) {
          throw new Error(result.message);
        }
        
        toast({ 
          title: "Success", 
          description: children.length === 1 
            ? "Child successfully linked to your account! Redirecting to complete setup..."
            : `${children.length} children successfully linked to your account! Redirecting to complete setup...`
        })
        // Redirect to term-plan to complete onboarding
        console.log('[Onboarding] Redirecting to term-plan');
        router.push("/term-plan?onboarding=1")
      } catch (err: unknown) {
        // Handle registration failure by saving locally
        console.error('[Onboarding] Registration failed:', err);
        toast({
          title: "Registration Failed",
          description: err instanceof Error ? err.message : "Failed to complete child registration.",
          variant: "destructive",
        })
        
        // Inform user that data was saved locally
        toast({
          title: "Data Saved Locally",
          description: "Child data has been saved locally and will be synced when connection is restored.",
        })
        
        // Still redirect to term-plan to continue onboarding
        console.log('[Onboarding] Redirecting to term-plan despite local save');
        router.push("/term-plan?onboarding=1")
      }
    } catch (err: unknown) {
      console.error('[Onboarding] Unexpected error:', err);
      console.error('[Onboarding] Error details:', {
        message: err instanceof Error ? err.message : 'Unknown error',
        stack: err instanceof Error ? err.stack : 'No stack trace'
      });
      toast({
        title: "Registration Error",
        description: err instanceof Error ? err.message : "Failed to complete child registration. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleBackToDashboard = () => {
    router.push("/guardian")
  }

  const handleSkipToHomepage = () => {
    // Get current user for navigation
    supabase.auth.getUser().then(({ data: { user } }) => {
      skipToHomepage(router, user);
    }).catch(() => {
      // If we can't get the user, still navigate to homepage
      router.push("/homepage");
    });
  }

  const parseCsv = (csvText: string): { nickname: string; age: number; grade: string }[] => {
    const lines = csvText.trim().split('\n')
    const headers = lines[0].split(',').map(h => h.trim().toLowerCase())
    
    // Validate headers
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
      
      // Validate data
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
    
    // Validate file type
    if (file.type !== 'text/csv' && !file.name.endsWith('.csv')) {
      toast({
        title: "Invalid file type",
        description: "Please upload a CSV file",
        variant: "destructive",
      })
      return
    }
    
    // Validate file size (max 1MB)
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
        
        // Update state with parsed data
        setChildren(parsedData.map(child => ({
          nickname: child.nickname,
          age: child.age,
          grade: child.grade
        })))
        
        // Clear errors
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

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Progress indicator */}
        <div className="flex justify-center mb-8">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-white/20 rounded-full"></div>
            <div className="w-8 h-2 bg-white/80 rounded-full"></div>
            <div className="w-2 h-2 bg-white/20 rounded-full"></div>
          </div>
        </div>

        {/* Icon */}
        <div className="flex justify-center mb-8">
          <div className="relative">
            <div className="absolute inset-0 bg-white/10 rounded-full blur-xl" />
            <div className="relative w-16 h-16 bg-white/[0.03] backdrop-blur-sm border border-white/10 rounded-full flex items-center justify-center">
              <User className="w-8 h-8 text-white/80" />
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="text-center space-y-2 mb-10">
          <h1 className="text-3xl font-light tracking-tight">
            Set up your child{children.length > 1 ? 'ren' : ''}
          </h1>
          <p className="text-white/50 text-sm">
            This helps Lana explain at the right level
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* CSV Import Section */}
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
            <div className="text-xs text-white/40 bg-white/5 rounded-lg p-3">
              <p className="font-medium mb-1">CSV Format Example:</p>
              <pre className="whitespace-pre-wrap">
{`nickname,age,grade
John,10,6
Jane,12,8
Bob,15,10`}
              </pre>
            </div>
          </div>

          {children.map((child, index) => (
            <div key={index} className="space-y-6 p-4 rounded-xl bg-white/[0.02] border border-white/10">
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
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              )}
              
              <div className="space-y-2">
                <label 
                  htmlFor={`nickname-${index}`} 
                  className="block text-xs font-medium text-white/40 uppercase tracking-wider"
                >
                  Nickname
                </label>
                <div className="relative">
                  <input
                    id={`nickname-${index}`}
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
                  <p className="text-red-400 text-xs mt-1">{errors[index].nickname}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label 
                    htmlFor={`age-${index}`} 
                    className="block text-xs font-medium text-white/40 uppercase tracking-wider"
                  >
                    Age
                  </label>
                  <div className="relative">
                    <input
                      id={`age-${index}`}
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
                    <p className="text-red-400 text-xs mt-1">{errors[index].age}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <label 
                    htmlFor={`grade-${index}`} 
                    className="block text-xs font-medium text-white/40 uppercase tracking-wider"
                  >
                    Grade
                  </label>
                  <div className="relative">
                    <select
                      id={`grade-${index}`}
                      value={child.grade}
                      onChange={(e) => handleChildChange(index, 'grade', e.target.value)}
                      className={`w-full px-4 py-3 bg-white/[0.02] border rounded-lg text-white focus:outline-none focus:bg-white/[0.03] transition-all appearance-none cursor-pointer pl-10 pr-8 ${
                        errors[index] && errors[index].grade ? "border-red-500" : "border-white/10 focus:border-white/30"
                      }`}
                      style={{
                        backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%23ffffff40' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
                        backgroundPosition: 'right 0.5rem center',
                        backgroundRepeat: 'no-repeat',
                        backgroundSize: '1.5em 1.5em',
                      }}
                      required
                    >
                      <option value="" disabled className="bg-black text-white/50">
                        Select
                      </option>
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
                    <p className="text-red-400 text-xs mt-1">{errors[index].grade}</p>
                  )}
                </div>
              </div>
            </div>
          ))}

          {/* Add Child Button */}
          <Button
            type="button"
            onClick={addChild}
            variant="outline"
            className="w-full px-4 py-3 border border-white/20 text-white font-medium rounded-lg hover:bg-white/10 transition-all duration-200 flex items-center justify-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Another Child
          </Button>

          <div className="pt-4 space-y-3">
            <Button
              type="submit"
              className="w-full px-5 py-3.5 bg-white text-black font-medium text-sm rounded-lg hover:bg-white/95 transition-all duration-200 flex items-center justify-center"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Setting up...
                </>
              ) : (
                children.length === 1 ? "Finish setup" : `Finish setup for ${children.length} children`
              )}
            </Button>
            
            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={handleBackToDashboard}
                className="flex-1 px-5 py-3.5 border border-white/20 text-white font-medium text-sm rounded-lg hover:bg-white/10 transition-all duration-200 flex items-center justify-center"
              >
                <ChevronLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={handleSkipToHomepage}
                className="flex-1 px-5 py-3.5 border border-white/20 text-white font-medium text-sm rounded-lg hover:bg-white/10 transition-all duration-200 flex items-center justify-center"
              >
                Skip to homepage
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        </form>

        {/* Footer note */}
        <p className="text-center text-white/30 text-xs mt-8">
          You can add more children later from settings
        </p>
      </div>
    </div>
  )
}