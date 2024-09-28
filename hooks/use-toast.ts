import { useToast } from "@/components/ui/use-toast"

export function useCustomToast() {
  const { toast } = useToast()

  return {
    success: (title: string, description?: string) => {
      toast({
        title,
        description,
        variant: "default",
      })
    },
    error: (title: string, description?: string) => {
      toast({
        title,
        description,
        variant: "destructive",
      })
    }
  }
}