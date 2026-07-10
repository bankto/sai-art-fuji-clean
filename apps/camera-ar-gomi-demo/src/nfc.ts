interface NdefRecordInit {
  recordType: 'url' | 'text';
  data: string;
}

interface NdefMessageInit {
  records: NdefRecordInit[];
}

interface NDEFReaderInstance {
  write(message: NdefMessageInit): Promise<void>;
}

declare global {
  interface Window {
    NDEFReader?: new () => NDEFReaderInstance;
  }
}

export function canWriteWebNfc(): boolean {
  return window.isSecureContext && typeof window.NDEFReader === 'function';
}

export function getNfcFallbackMessage(): string {
  if (!window.isSecureContext) {
    return 'NFC書き込みはHTTPSまたはlocalhostでのみ試せます。非対応端末ではQRまたは既製NFCアプリに共有URLを貼り付けてください。';
  }

  return 'このブラウザではWeb NFC書き込みを表示しません。iPhoneは事前書き込み済みタグの読み取り、またはAndroid/既製NFCアプリでの書き込みを前提にします。';
}

export async function writeUrlToNfc(url: string): Promise<void> {
  if (!canWriteWebNfc() || !window.NDEFReader) {
    throw new Error(getNfcFallbackMessage());
  }

  const writer = new window.NDEFReader();
  await writer.write({
    records: [{ recordType: 'url', data: url }],
  });
}
