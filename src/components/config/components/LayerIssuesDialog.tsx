import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DataSource } from '@/types/config';

interface LayerIssuesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  layers: Array<{ source: DataSource; interfaceGroup: string; layerName: string }>;
}

export const LayerIssuesDialog = ({ open, onOpenChange, title, layers }: LayerIssuesDialogProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <div className="flex-1 overflow-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Interface Group</TableHead>
                <TableHead>Layer Name</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {layers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={2} className="text-center text-muted-foreground">
                    No layers found
                  </TableCell>
                </TableRow>
              ) : (
                layers.map((layer, index) => (
                  <TableRow key={index}>
                    <TableCell>{layer.interfaceGroup}</TableCell>
                    <TableCell>{layer.layerName}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </DialogContent>
    </Dialog>
  );
};
