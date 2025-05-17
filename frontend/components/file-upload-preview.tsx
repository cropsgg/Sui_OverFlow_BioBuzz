"use client"

import type React from "react"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, FileText, ImageIcon, FileVideo, FileAudio, File, Upload } from "lucide-react"
import { Button } from "@/components/ui/button"

type FileWithPreview = {
  file: File
  id: string
  previewUrl?: string
  type: "image" | "video" | "audio" | "document" | "other"
}

export function FileUploadPreview({
  onFilesSelected,
}: {
  onFilesSelected: (files: File[]) => void
}) {
  const [files, setFiles] = useState<FileWithPreview[]>([])
  const [isDragging, setIsDragging] = useState(false)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      addFiles(Array.from(e.target.files))
    }
  }

  const addFiles = (newFiles: File[]) => {
    const newFilesWithPreview = newFiles.map((file) => {
      const id = Math.random().toString(36).substring(2, 11)
      let type: FileWithPreview["type"] = "other"
      let previewUrl: string | undefined = undefined

      if (file.type.startsWith("image/")) {
        type = "image"
        previewUrl = URL.createObjectURL(file)
      } else if (file.type.startsWith("video/")) {
        type = "video"
        previewUrl = URL.createObjectURL(file)
      } else if (file.type.startsWith("audio/")) {
        type = "audio"
        previewUrl = URL.createObjectURL(file)
      } else if (
        file.type === "application/pdf" ||
        file.type.includes("document") ||
        file.type.includes("text/") ||
        file.name.endsWith(".doc") ||
        file.name.endsWith(".docx") ||
        file.name.endsWith(".txt") ||
        file.name.endsWith(".pdf")
      ) {
        type = "document"
      }

      return { file, id, previewUrl, type }
    })

    setFiles((prev) => [...prev, ...newFilesWithPreview])
    onFilesSelected(newFiles)
  }

  const removeFile = (id: string) => {
    setFiles((prev) => {
      const fileToRemove = prev.find((f) => f.id === id)
      if (fileToRemove?.previewUrl) {
        URL.revokeObjectURL(fileToRemove.previewUrl)
      }
      return prev.filter((f) => f.id !== id)
    })
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => {
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    if (e.dataTransfer.files) {
      addFiles(Array.from(e.dataTransfer.files))
    }
  }

  return (
    <div className="space-y-4">
      <div
        className={`relative rounded-lg border-2 border-dashed p-4 transition-colors ${
          isDragging ? "border-primary bg-primary/10" : "border-border"
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <input
          type="file"
          id="file-upload"
          multiple
          className="absolute inset-0 cursor-pointer opacity-0"
          onChange={handleFileChange}
        />
        <div className="flex flex-col items-center justify-center py-4 text-center">
          <Upload className="mb-2 h-8 w-8 text-muted-foreground" />
          <p className="mb-1 text-sm font-medium">Drag files here or click to upload</p>
          <p className="text-xs text-muted-foreground">Support for images, videos, audio, and documents</p>
        </div>
      </div>

      <AnimatePresence>
        {files.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
              {files.map((file) => (
                <FilePreview key={file.id} file={file} onRemove={() => removeFile(file.id)} />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function FilePreview({ file, onRemove }: { file: FileWithPreview; onRemove: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="group relative overflow-hidden rounded-lg border bg-card"
    >
      <Button
        size="icon"
        variant="destructive"
        className="absolute right-1 top-1 z-10 h-6 w-6 opacity-0 transition-opacity group-hover:opacity-100"
        onClick={(e) => {
          e.stopPropagation()
          onRemove()
        }}
      >
        <X className="h-3 w-3" />
      </Button>

      <div className="aspect-square p-2">
        {file.type === "image" && file.previewUrl ? (
          <img
            src={file.previewUrl || "/placeholder.svg"}
            alt={file.file.name}
            className="h-full w-full rounded object-cover"
          />
        ) : file.type === "video" && file.previewUrl ? (
          <video src={file.previewUrl} className="h-full w-full rounded object-cover" controls />
        ) : file.type === "audio" && file.previewUrl ? (
          <div className="flex h-full flex-col items-center justify-center">
            <FileAudio className="h-12 w-12 text-primary" />
            <audio src={file.previewUrl} className="mt-2 w-full" controls />
          </div>
        ) : file.type === "document" ? (
          <div className="flex h-full flex-col items-center justify-center">
            <FileText className="h-12 w-12 text-primary" />
          </div>
        ) : (
          <div className="flex h-full flex-col items-center justify-center">
            <File className="h-12 w-12 text-primary" />
          </div>
        )}
      </div>

      <div className="border-t bg-card p-2">
        <p className="truncate text-xs">{file.file.name}</p>
        <p className="text-xs text-muted-foreground">{(file.file.size / 1024).toFixed(1)} KB</p>
      </div>
    </motion.div>
  )
}

export function FileAttachment({
  file,
  onRemove,
}: {
  file: {
    name: string
    type: string
    size: number
    url?: string
  }
  onRemove?: () => void
}) {
  const getFileIcon = () => {
    if (file.type.startsWith("image/")) return <ImageIcon className="h-4 w-4" />
    if (file.type.startsWith("video/")) return <FileVideo className="h-4 w-4" />
    if (file.type.startsWith("audio/")) return <FileAudio className="h-4 w-4" />
    if (file.type === "application/pdf" || file.type.includes("document") || file.type.includes("text/"))
      return <FileText className="h-4 w-4" />
    return <File className="h-4 w-4" />
  }

  return (
    <div className="flex items-center gap-2 rounded-md border bg-card p-2 text-sm">
      {getFileIcon()}
      <span className="truncate">{file.name}</span>
      <span className="text-xs text-muted-foreground">{(file.size / 1024).toFixed(1)} KB</span>
      {onRemove && (
        <Button size="icon" variant="ghost" className="ml-auto h-6 w-6" onClick={onRemove}>
          <X className="h-3 w-3" />
        </Button>
      )}
    </div>
  )
}
