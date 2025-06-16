
import { useToast } from '@/hooks/use-toast';

interface ValidationData {
  name: string;
  legendType: 'swatch' | 'gradient' | 'image';
  legendUrl: string;
  startColor: string;
  endColor: string;
  minValue: string;
  maxValue: string;
}

export const useLayerCardFormValidation = () => {
  const { toast } = useToast();

  const validateForm = (formData: ValidationData): boolean => {
    if (!formData.name.trim()) {
      toast({
        title: "Missing Required Fields",
        description: "Please provide a layer name.",
        variant: "destructive"
      });
      return false;
    }

    // Validate legend URL when type is 'image'
    if (formData.legendType === 'image' && !formData.legendUrl.trim()) {
      toast({
        title: "Missing Required Fields",
        description: "Please provide a URL for the image legend.",
        variant: "destructive"
      });
      return false;
    }

    // Validate gradient fields when type is 'gradient'
    if (formData.legendType === 'gradient') {
      if (!formData.startColor.trim() || !formData.endColor.trim() || !formData.minValue.trim() || !formData.maxValue.trim()) {
        toast({
          title: "Missing Required Fields",
          description: "Please provide start color, end color, min value, and max value for gradient legend.",
          variant: "destructive"
        });
        return false;
      }
      
      const minNum = parseFloat(formData.minValue);
      const maxNum = parseFloat(formData.maxValue);
      
      if (isNaN(minNum) || isNaN(maxNum)) {
        toast({
          title: "Invalid Values",
          description: "Min and max values must be valid numbers.",
          variant: "destructive"
        });
        return false;
      }
      
      if (minNum >= maxNum) {
        toast({
          title: "Invalid Range",
          description: "Min value must be less than max value.",
          variant: "destructive"
        });
        return false;
      }
    }

    return true;
  };

  return { validateForm };
};
