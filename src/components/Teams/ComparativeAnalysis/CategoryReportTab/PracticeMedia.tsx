import { Box, CardMedia, useTheme, type SxProps } from '@mui/material';
import { useState, type SyntheticEvent } from 'react';

const PracticeMedia = ({
  category,
  index,
  sx,
  imgSize = 28,
  dotSize = 12,
}: {
  category: string;
  index: number;
  sx?: SxProps;
  imgSize?: number;
  dotSize?: number;
}) => {
  const [imgFailed, setImgFailed] = useState(false);
  const { palette } = useTheme();

  const slug = category
    .toLowerCase()
    .replace(/\s+/g, '_')
    .replace(/[^a-z0-9_]/g, '');

  const png = `/categories/${slug}.png`;
  const jpg = `/categories/${slug}.jpg`;

  const colorPool = [
    palette.primary.main,
    palette.secondary.main,
    palette.supervisor?.main ?? '#ff6b35',
    palette.success.main,
    palette.warning.main,
  ];
  const dotColor = colorPool[index % colorPool.length];

  if (!imgFailed) {
    return (
      <CardMedia
        component="img"
        src={png}
        onError={(e: SyntheticEvent<HTMLImageElement>) => {
          const img = e.currentTarget as HTMLImageElement;
          // try jpg on first error
          if (img.src.endsWith('.png')) {
            img.src = jpg;
          } else {
            setImgFailed(true);
          }
        }}
        alt={category}
        sx={{ width: imgSize, height: imgSize, objectFit: 'cover', borderRadius: 1, ...sx }}
      />
    );
  }

  return <Box sx={{ width: dotSize, height: dotSize, borderRadius: '50%', backgroundColor: dotColor }} />;
};

export default PracticeMedia;
