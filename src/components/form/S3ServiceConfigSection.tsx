
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Info, Database } from 'lucide-react';
import { validateS3Url } from '@/utils/s3Utils';
import { DataSource } from '@/types/config';

interface S3ServiceConfigSectionProps {
  formData: DataSource;
  onUpdateFormData: (path: string, value: any) => void;
}

const S3ServiceConfigSection = ({
  formData,
  onUpdateFormData
}: S3ServiceConfigSectionProps) => {
  const isValidUrl = formData.data[0]?.url ? validateS3Url(formData.data[0].url) : true;

  return (
    <Card className="border-primary/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-primary">
          <Database className="h-5 w-5" />
          S3 Bucket Configuration
        </CardTitle>
        <CardDescription>
          Configure access to an Amazon S3 bucket containing geospatial data files.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            <strong>Required S3 Bucket Settings:</strong>
            <ul className="mt-2 space-y-1 text-sm">
              <li>• <strong>Public Read Access:</strong> Bucket policy must allow public read access for the objects you want to use</li>
              <li>• <strong>CORS Configuration:</strong> Must allow GET requests from your domain</li>
              <li>• <strong>Static Website Hosting:</strong> Not required, but may simplify access</li>
            </ul>
            <div className="mt-3 p-2 bg-muted rounded text-xs">
              <strong>Example CORS Configuration:</strong><br/>
              <code>{`[{
  "AllowedHeaders": ["*"],
  "AllowedMethods": ["GET"],
  "AllowedOrigins": ["*"],
  "ExposeHeaders": []
}]`}</code>
            </div>
          </AlertDescription>
        </Alert>

        <div className="space-y-2">
          <Label htmlFor="s3Url">S3 Bucket URL *</Label>
          <Input
            id="s3Url"
            value={formData.data[0]?.url || ''}
            onChange={(e) => onUpdateFormData('data.0.url', e.target.value)}
            placeholder="https://esa-apex.s3.eu-west-1.amazonaws.com/"
            className={!isValidUrl ? 'border-red-300' : ''}
          />
          {!isValidUrl && (
            <p className="text-sm text-red-500">
              Please enter a valid S3 bucket URL
            </p>
          )}
          <p className="text-xs text-muted-foreground">
            Supported formats: https://bucket-name.s3.region.amazonaws.com/ or https://s3.region.amazonaws.com/bucket-name/
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="zIndex">Z-Index</Label>
          <Input
            id="zIndex"
            type="number"
            value={formData.data[0]?.zIndex || 2}
            onChange={(e) => onUpdateFormData('data.0.zIndex', parseInt(e.target.value) || 2)}
            min="0"
            max="100"
          />
        </div>
      </CardContent>
    </Card>
  );
};

export default S3ServiceConfigSection;
