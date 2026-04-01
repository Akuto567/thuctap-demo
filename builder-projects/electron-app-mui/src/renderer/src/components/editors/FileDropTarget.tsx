import { Box, SxProps } from '@mui/material'
import React from 'react'
import { useDropzone } from 'react-dropzone'

export interface FileDropTargetProps {
  onFileDrop: (filePath: string) => void
  children: React.ReactNode
  sx?: SxProps
  disabled?: boolean
}

/**
 * Wraps any children with react-dropzone for image files.
 * Highlights when an image is dragged over. Calls onFileDrop with the
 * native file path.
 */
export function FileDropTarget({
  onFileDrop,
  children,
  sx,
  disabled
}: FileDropTargetProps): React.ReactElement {
  const { getRootProps, isDragActive } = useDropzone({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onDrop: (acceptedFiles: any[], _rejections, event: any) => {
      // Prevent bubbling to parents (e.g. from item card to group card)
      event?.stopPropagation()
      const file = acceptedFiles.find((f) => f.type?.startsWith('image/'))
      if (file) {
        onFileDrop(window.electronAPI.getPathForFile(file))
      }
    },
    onDragEnter: (e) => e.stopPropagation(),
    onDragOver: (e) => e.stopPropagation(),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    getFilesFromEvent: (event: any): any => {
      const files = event.dataTransfer?.files
      return files ? Array.from(files) : []
    },
    noClick: true, // Let children handle clicks (e.g. Buttons)
    disabled,
    accept: { 'image/*': [] }
  })

  return (
    <Box
      {...getRootProps()}
      sx={[
        {
          transition: 'outline 0.1s, background 0.1s',
          outline: isDragActive ? '2px solid #6ee7b7' : '2px solid transparent',
          outlineOffset: -2,
          background: isDragActive ? 'rgba(110,231,183,0.05)' : 'transparent'
        },
        ...(Array.isArray(sx) ? sx : [sx])
      ]}
    >
      {children}
    </Box>
  )
}
