import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';

type SectionProps = {
  children?: React.ReactNode;
  title?: string;
  color?: string; // Hex color like "#3b82f6"
};

export function Section(props: SectionProps) {
  const headerStyle = props.color
    ? {
        backgroundColor: props.color,
        color: getContrastColor(props.color),
      }
    : undefined;

  return (
    <Card>
      <CardHeader style={headerStyle}>
        {props.title && (
          <CardTitle className="font-rhr-ns">{props.title}</CardTitle>
        )}
      </CardHeader>
      <CardContent className="p-2 pt-0">
        <div className="flex flex-col gap-4">{props.children}</div>
      </CardContent>
    </Card>
  );
}

// Calculate contrast color (white or black) based on background brightness
function getContrastColor(hexColor: string): string {
  // Remove # if present
  const hex = hexColor.replace('#', '');
  
  // Convert to RGB
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  
  // Calculate luminance
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  
  // Return white for dark backgrounds, black for light backgrounds
  return luminance > 0.5 ? '#000000' : '#ffffff';
}
