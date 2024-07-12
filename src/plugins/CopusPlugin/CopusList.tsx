import { createDOMRange, createRectsFromDOMRange } from '@lexical/selection';
import { $getSelection, $isRangeSelection, LexicalEditor, RangeSelection } from 'lexical';
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';

export function CopusList({
  editor,
  selectCopusList,
  getMarkInfo,
}: {
  editor: LexicalEditor;
  selectCopusList?: string[];
  getMarkInfo?: (ids: string[]) => Promise<any[]>;
}) {
  const boxRef = useRef<HTMLDivElement>(null);
  const selectionState = useMemo(
    () => ({
      container: document.createElement('div'),
      elements: [],
    }),
    [],
  );
  const selectionRef = useRef<RangeSelection | null>(null);

  const updateLocation = useCallback(() => {
    editor.getEditorState().read(() => {
      const selection = $getSelection();

      if ($isRangeSelection(selection)) {
        selectionRef.current = selection.clone();
        const anchor = selection.anchor;
        const focus = selection.focus;
        const range = createDOMRange(editor, anchor.getNode(), anchor.offset, focus.getNode(), focus.offset);
        const boxElem = boxRef.current;
        if (range !== null && boxElem !== null) {
          const { left, bottom, width } = range.getBoundingClientRect();
          const selectionRects = createRectsFromDOMRange(editor, range);
          let correctedLeft = selectionRects.length === 1 ? left + width / 2 - 125 : left - 125;
          if (correctedLeft < 10) {
            correctedLeft = 10;
          }
          boxElem.style.left = `${correctedLeft}px`;
          boxElem.style.top = `${bottom + 10 + (window.pageYOffset || document.documentElement.scrollTop)}px`;
          const selectionRectsLength = selectionRects.length;
          const { container } = selectionState;
          const elements: Array<HTMLSpanElement> = selectionState.elements;
          const elementsLength = elements.length;

          for (let i = 0; i < selectionRectsLength; i++) {
            const selectionRect = selectionRects[i];
            let elem: HTMLSpanElement = elements[i];
            if (elem === undefined) {
              elem = document.createElement('span');
              elements[i] = elem;
              container.appendChild(elem);
            }
            const color = '255, 212, 0';
            const style = `position:absolute;top:${
              selectionRect.top + (window.pageYOffset || document.documentElement.scrollTop)
            }px;left:${selectionRect.left}px;height:${selectionRect.height}px;width:${
              selectionRect.width
            }px;background-color:rgba(${color}, 0.3);pointer-events:none;z-index:5;`;
            elem.style.cssText = style;
          }
          for (let i = elementsLength - 1; i >= selectionRectsLength; i--) {
            const elem = elements[i];
            container.removeChild(elem);
            elements.pop();
          }
        }
      }
    });
  }, [editor, selectionState]);

  useLayoutEffect(() => {
    updateLocation();
    const container = selectionState.container;
    const body = document.body;
    if (body !== null) {
      body.appendChild(container);
      return () => {
        body.removeChild(container);
      };
    }
  }, [selectionState.container, updateLocation]);

  useEffect(() => {
    window.addEventListener('resize', updateLocation);

    return () => {
      window.removeEventListener('resize', updateLocation);
    };
  }, [updateLocation]);

  const inputRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  const [currentTab, setCurrentTab] = useState('Source');

  return (
    <div className={`CopusPlugin_CopusList Copus_${currentTab}`} ref={boxRef}>
      <div className="tab-wrap">
        <div
          className="tab tab-source"
          onClick={() => {
            setCurrentTab('Source');
          }}>
          Sources
        </div>
        <div
          className="tab tab-branch"
          onClick={() => {
            setCurrentTab('Branch');
          }}>
          Branches
        </div>
      </div>
      <div className="list-main">
        <div className="title">Inspired by Fractopus</div>
        <div className="description">
          Lorem ipsum dolor sit amet, consectetur adipiscing elit. lacus, ut interdum tellus elit sed risus. Maecenas
          eget condimentum
        </div>
      </div>
    </div>
  );
}
