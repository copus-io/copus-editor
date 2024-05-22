/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import {useLexicalComposerContext} from '@lexical/react/LexicalComposerContext';
import {DRAG_DROP_PASTE} from '@lexical/rich-text';
import {isMimeType, mediaFileReader} from '@lexical/utils';
import {COMMAND_PRIORITY_LOW} from 'lexical';
import {useEffect} from 'react';

import {INSERT_IMAGE_COMMAND} from '../ImagesPlugin';
import {INSERT_AUDIO_COMMAND} from '../AudioPlugin';
import useFlashMessage from '../../hooks/useFlashMessage';

const ACCEPTABLE_IMAGE_TYPES = [
  'image/',
  'image/heic',
  'image/heif',
  'image/gif',
  'image/webp',
];

const ACCEPTABLE_AUDIO_TYPES = [
  'audio/',
  'audio/mpeg',
  'audio/m4a',
  'audio/mp3',
  'audio/x-mpeg',
];

export default function DragDropPaste(): null {
  const [editor] = useLexicalComposerContext();
  const showFlashMessage = useFlashMessage();

  useEffect(() => {
    return editor.registerCommand(
      DRAG_DROP_PASTE,
      (files) => {
        (async () => {
          const filesResult = await mediaFileReader(
            files,
            [ACCEPTABLE_IMAGE_TYPES, ACCEPTABLE_AUDIO_TYPES].flatMap((x) => x),
          );

          if (files.length > filesResult.length) {
            showFlashMessage('Some file types are not supported');
          }

          for (const {file} of filesResult) {
            if (isMimeType(file, ACCEPTABLE_IMAGE_TYPES)) {
              if (file.size > 10000000) {
                showFlashMessage('Image file size should be less than 10MB');
                return;
              }
              editor.dispatchCommand(INSERT_IMAGE_COMMAND, {
                altText: file.name,
                src: URL.createObjectURL(file),
                file: file,
              });
            }

            if (isMimeType(file, ACCEPTABLE_AUDIO_TYPES)) {
              if (file.size > 10000000) {
                showFlashMessage('Audio file size should be less than 10MB');
                return;
              }
              editor.dispatchCommand(INSERT_AUDIO_COMMAND, {
                src: URL.createObjectURL(file),
                controls: true,
                file: file,
              });
            }
          }
        })();
        return true;
      },
      COMMAND_PRIORITY_LOW,
    );
  }, [editor]);
  return null;
}
