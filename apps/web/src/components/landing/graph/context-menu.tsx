import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

type ContextMenuProps = {
  id: string;
  top?: number;
  left?: number;
  right?: number;
  bottom?: number;
  onClose: () => void;
};

export function GraphContextMenu({
  id,
  top,
  left,
  right,
  bottom,
  onClose,
}: ContextMenuProps) {
  return (
    <div
      className="absolute z-20 min-w-48 rounded-md border bg-popover p-3 text-sm shadow-md"
      style={{ top, left, right, bottom }}
      role="menu"
      aria-label="Node actions"
    >
      <p className="font-medium">Document node</p>
      <p className="mt-1 text-xs text-muted-foreground">ID: {id}</p>
      <div className="mt-3 flex items-center gap-2">
        <Badge variant="secondary">Concept link</Badge>
        <Button type="button" variant="ghost" size="sm" onClick={onClose}>
          Close
        </Button>
      </div>
    </div>
  );
}
