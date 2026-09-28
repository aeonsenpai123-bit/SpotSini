import React from 'react';

/** Original symbol extracted from the user's SP (2).pdf, not a traced substitute. */
export const BrandMark: React.FC = () => (
  <picture className="block w-full h-full">
    <source srcSet="/brand/spotsini-symbol.webp" type="image/webp" />
    <img
      src="/brand/spotsini-symbol.png"
      alt="Logo SpotSiNi"
      width={380}
      height={382}
      decoding="async"
      className="w-full h-full object-contain"
    />
  </picture>
);
