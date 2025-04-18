/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */
type Props = Readonly<{
  'data-test-id'?: string;
  accept?: string;
  label: string;
  onChange: (files: FileList | null) => void;
  multiple?: boolean;
}>;

export default function FileInput({
  accept,
  label,
  onChange,
  'data-test-id': dataTestId,
  multiple,
}: Props): JSX.Element {
  return (
    <div className="Input__wrapper">
      <label className="Input__label">{label}</label>
      <input
        type="file"
        accept={accept}
        className="Input__input"
        onChange={(e) => onChange(e.target.files)}
        data-test-id={dataTestId}
        multiple={multiple}
      />
    </div>
  );
}
