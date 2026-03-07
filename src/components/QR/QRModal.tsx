import { Camera, Copy, Download, QrCode } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { useMemo, useRef, useState } from 'react';
import { getFieldValue, useQRScoutState } from '../../store/store';
import { Button } from '../ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogTitle,
  DialogTrigger,
} from '../ui/dialog';
import { PreviewText } from './PreviewText';

export interface QRModalProps {
  disabled?: boolean;
}

export function QRModal(props: QRModalProps) {
  const fieldValues = useQRScoutState(state => state.fieldValues);
  const formData = useQRScoutState(state => state.formData);
  const qrContainerRef = useRef<HTMLDivElement>(null);
  const [isSavingScreenshot, setIsSavingScreenshot] = useState(false);
  const [isCopyingScreenshot, setIsCopyingScreenshot] = useState(false);
  const robotOrTeam = getFieldValue('robot') || getFieldValue('teamNumber');
  const title = `${robotOrTeam} - M${getFieldValue(
    'matchNumber',
  )}`.toUpperCase();

  const qrCodeData = useMemo(
    () => fieldValues.map(f => f.value).join(formData.delimiter),
    [fieldValues],
  );
  //Two seperate values are required- qrCodePreview is what is shown to the user beneath the QR code, qrCodeData is the actual data.

  const generateCanvas = async () => {
    const svg = qrContainerRef.current?.querySelector('svg');
    if (!svg) {
      return null;
    }

    const serialized = new XMLSerializer().serializeToString(svg);
    const svgString = serialized.includes('xmlns="http://www.w3.org/2000/svg"')
      ? serialized
      : serialized.replace(
          '<svg',
          '<svg xmlns="http://www.w3.org/2000/svg"',
        );

    const svgBlob = new Blob([svgString], {
      type: 'image/svg+xml;charset=utf-8',
    });
    const svgUrl = URL.createObjectURL(svgBlob);

    const qrImage = await new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error('Unable to load QR image'));
      img.src = svgUrl;
    });

    const qrSize = Number(svg.getAttribute('width') ?? 256);
    const padding = 32;
    const titleFontSize = 32;
    const gap = 24;

    const measureCanvas = document.createElement('canvas');
    const measureCtx = measureCanvas.getContext('2d');
    if (!measureCtx) {
      URL.revokeObjectURL(svgUrl);
      return null;
    }

    measureCtx.font = `700 ${titleFontSize}px sans-serif`;
    const titleWidth = Math.ceil(measureCtx.measureText(title).width);

    const canvasWidth = Math.max(qrSize + padding * 2, titleWidth + padding * 2);
    const canvasHeight = padding + titleFontSize + gap + qrSize + padding;

    const canvas = document.createElement('canvas');
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      URL.revokeObjectURL(svgUrl);
      return null;
    }

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);

    ctx.fillStyle = '#111827';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.font = `700 ${titleFontSize}px sans-serif`;
    ctx.fillText(title, canvasWidth / 2, padding);

    ctx.drawImage(
      qrImage,
      Math.floor((canvasWidth - qrSize) / 2),
      padding + titleFontSize + gap,
      qrSize,
      qrSize,
    );

    URL.revokeObjectURL(svgUrl);
    return canvas;
  };

  const handleSaveScreenshot = async () => {
    setIsSavingScreenshot(true);

    try {
      const canvas = await generateCanvas();
      if (!canvas) return;

      const downloadLink = document.createElement('a');
      downloadLink.download = `${title.replace(/[^a-z0-9]+/gi, '_')}_qr.png`;
      downloadLink.href = canvas.toDataURL('image/png');
      downloadLink.click();
    } finally {
      setIsSavingScreenshot(false);
    }
  };

  const handleCopyScreenshot = async () => {
    setIsCopyingScreenshot(true);

    try {
      const canvas = await generateCanvas();
      if (!canvas) return;

      await new Promise<void>((resolve, reject) => {
        canvas.toBlob(async (blob) => {
          if (!blob) {
            reject(new Error('Failed to create image blob'));
            return;
          }
          
          try {
            await navigator.clipboard.write([
              new ClipboardItem({ 'image/png': blob })
            ]);
            resolve();
          } catch (err) {
            reject(err);
          }
        }, 'image/png');
      });
    } finally {
      setIsCopyingScreenshot(false);
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button disabled={props.disabled}>
          <QrCode className="size-5" />
          Commit
        </Button>
      </DialogTrigger>
      <DialogContent className="h-[95%]">
        <div ref={qrContainerRef} className="flex flex-col items-center gap-4">
          <DialogTitle className="text-3xl text-primary text-center font-rhr-ns tracking-wider ">
            {title}
          </DialogTitle>
          <div className="bg-white p-4 rounded-md">
            <QRCodeSVG className="m-2 mt-4" size={256} value={qrCodeData} />
          </div>
        </div>
        <div className="flex flex-col items-center gap-6 overflow-y-scroll">
          <PreviewText data={qrCodeData} />
        </div>
        <DialogFooter>
          <Button
            variant="ghost"
            onClick={handleSaveScreenshot}
            disabled={isSavingScreenshot}
          >
            <Download className="size-4" /> {isSavingScreenshot ? 'Saving...' : 'Save Screenshot'}
          </Button>
          <Button
            variant="ghost"
            onClick={handleCopyScreenshot}
            disabled={isCopyingScreenshot}
          >
            <Camera className="size-4" /> {isCopyingScreenshot ? 'Copying...' : 'Copy Screenshot'}
          </Button>
          <Button
            variant="ghost"
            onClick={() => navigator.clipboard.writeText(qrCodeData)}
          >
            <Copy className="size-4" /> Copy Data
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
