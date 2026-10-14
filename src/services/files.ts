import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system/legacy';
import * as Crypto from 'expo-crypto';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import { Attachment, makeId } from '../domain/types';

export type PickedFile = { uri: string; name: string; mimeType?: string | null; size?: number };
export const MAX_FILES = 8;
export const MAX_BYTES = 20 * 1024 * 1024;
const allowed = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];
export async function pickDocuments(): Promise<PickedFile[]> {
  const result = await DocumentPicker.getDocumentAsync({
    type: allowed,
    multiple: true,
    copyToCacheDirectory: true,
  });
  return result.canceled ? [] : result.assets;
}
export async function pickPhotos(camera = false): Promise<PickedFile[]> {
  if (camera) {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted)
      throw new Error('Allow camera access in your device settings to photograph a lesson.');
  }
  const options: ImagePicker.ImagePickerOptions = {
    mediaTypes: ['images'],
    quality: 0.85,
    allowsMultipleSelection: !camera,
    selectionLimit: MAX_FILES,
    base64: false,
  };
  const result = camera
    ? await ImagePicker.launchCameraAsync(options)
    : await ImagePicker.launchImageLibraryAsync(options);
  if (result.canceled) return [];
  const files: PickedFile[] = [];
  for (const asset of result.assets) {
    // Normalize camera and library images, including iPhone HEIC, into API-compatible JPEGs.
    const converted = await manipulateAsync(asset.uri, [], {
      compress: 0.9,
      format: SaveFormat.JPEG,
    });
    files.push({
      uri: converted.uri,
      name: `${(asset.fileName ?? `Lesson-${makeId()}`).replace(/\.[^.]+$/, '')}.jpg`,
      mimeType: 'image/jpeg',
    });
  }
  return files;
}
function mime(file: PickedFile): string {
  const extension = file.name.split('.').pop()?.toLowerCase();
  return (
    file.mimeType ||
    {
      pdf: 'application/pdf',
      jpg: 'image/jpeg',
      jpeg: 'image/jpeg',
      png: 'image/png',
      webp: 'image/webp',
    }[extension ?? ''] ||
    ''
  );
}
export async function prepareAttachments(
  files: PickedFile[],
): Promise<{ attachments: Attachment[]; fingerprint: string }> {
  if (!files.length) throw new Error('Attach a lesson photo or PDF first.');
  if (files.length > MAX_FILES) throw new Error(`Use up to ${MAX_FILES} files per lesson.`);
  const folder = `${FileSystem.documentDirectory}lessons/`;
  await FileSystem.makeDirectoryAsync(folder, { intermediates: true });
  const attachments: Attachment[] = [];
  let total = 0;
  try {
    for (const file of files) {
      const mimeType = mime(file);
      if (!allowed.includes(mimeType))
        throw new Error('Use PDF, JPEG, PNG, or WebP files. Export HEIC photos as JPEG first.');
      const info = await FileSystem.getInfoAsync(file.uri);
      if (!info.exists || info.isDirectory)
        throw new Error(`The file “${file.name}” is no longer available. Attach it again.`);
      const size = info.size;
      if (!size) throw new Error(`The file “${file.name}” is empty.`);
      total += size;
      if (total > MAX_BYTES)
        throw new Error('Keep each lesson under 20 MB. Split larger PDFs into smaller lessons.');
      const base64 = await FileSystem.readAsStringAsync(file.uri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      const hash = await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, base64);
      if (attachments.some((a) => a.hash === hash)) continue;
      // The picker cache is temporary; copy sources into the app's private document directory.
      const id = makeId();
      const uri = `${folder}${id}.${mimeType === 'application/pdf' ? 'pdf' : mimeType.split('/')[1]}`;
      await FileSystem.copyAsync({ from: file.uri, to: uri });
      attachments.push({ id, name: file.name, uri, mimeType, size, hash });
    }
    const fingerprint = await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      attachments
        .map((a) => a.hash)
        .sort()
        .join(':'),
    );
    return { attachments, fingerprint };
  } catch (error) {
    await deleteAttachments(attachments);
    throw error;
  }
}
export async function deleteAttachments(attachments: Attachment[]): Promise<void> {
  await Promise.all(
    attachments.map((a) =>
      FileSystem.deleteAsync(a.uri, { idempotent: true }).catch(() => undefined),
    ),
  );
}
export const readBase64 = (attachment: Attachment) =>
  FileSystem.readAsStringAsync(attachment.uri, { encoding: FileSystem.EncodingType.Base64 });
