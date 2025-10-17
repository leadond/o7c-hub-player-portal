import React, { useState, useEffect } from "react";
import { PlayerImage } from "@/api/entities";
import { Image as ImageIcon, X, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion, AnimatePresence } from "framer-motion";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function PlayerImageGallery({ playerId, playerName }) {
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(null);
  const [editingImage, setEditingImage] = useState(null);

  useEffect(() => {
    loadImages();
  }, [playerId]);

  const loadImages = async () => {
    try {
      setLoading(true);
      const allImages = await PlayerImage.list();
      const playerImages = allImages.filter(img => img.playerId === playerId);
      setImages(playerImages);
      setLoading(false);
    } catch (error) {
      console.error("Error loading images:", error);
      setLoading(false);
    }
  };

  const handleUpdateImage = async (imageId, updates) => {
    try {
      await PlayerImage.update(imageId, updates);
      setEditingImage(null);
      loadImages();
    } catch (error) {
      console.error("Error updating image:", error);
    }
  };

  const handleDeleteImage = async (imageId) => {
    if (!confirm("Are you sure you want to delete this image?")) return;
    
    try {
      await PlayerImage.delete(imageId);
      loadImages();
      setSelectedImage(null);
    } catch (error) {
      console.error("Error deleting image:", error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-900" />
      </div>
    );
  }

  if (images.length === 0) {
    return (
      <div className="text-center py-12 bg-gray-50 rounded-xl">
        <ImageIcon className="w-12 h-12 text-gray-400 mx-auto mb-3" />
        <p className="text-gray-600">No images uploaded yet</p>
        <p className="text-sm text-gray-500 mt-2">
          Use the Upload Player Images page to add photos
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {images.map((image) => (
          <motion.div
            key={image.id}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative group cursor-pointer"
            onClick={() => setSelectedImage(image)}
          >
            <div className="aspect-square rounded-xl overflow-hidden bg-gray-100">
              <img
                src={image.imageUrl}
                alt={image.caption || image.filename}
                className="w-full h-full object-cover transition-transform group-hover:scale-110"
              />
            </div>
            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all rounded-xl flex items-center justify-center">
              <ImageIcon className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            {image.imageType && image.imageType !== "Other" && (
              <div className="absolute top-2 left-2 bg-blue-900 text-white text-xs px-2 py-1 rounded-md">
                {image.imageType}
              </div>
            )}
          </motion.div>
        ))}
      </div>

      <Dialog open={!!selectedImage} onOpenChange={() => setSelectedImage(null)}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>{selectedImage?.caption || selectedImage?.filename}</span>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setEditingImage(selectedImage);
                  }}
                >
                  Edit
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDeleteImage(selectedImage?.id)}
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </DialogTitle>
          </DialogHeader>
          <div className="mt-4">
            <img
              src={selectedImage?.imageUrl}
              alt={selectedImage?.caption || selectedImage?.filename}
              className="w-full rounded-xl"
            />
            {selectedImage?.caption && (
              <p className="mt-4 text-gray-700">{selectedImage.caption}</p>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!editingImage} onOpenChange={() => setEditingImage(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Image Details</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Caption
              </label>
              <Input
                value={editingImage?.caption || ""}
                onChange={(e) => setEditingImage({...editingImage, caption: e.target.value})}
                placeholder="Add a caption..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Image Type
              </label>
              <Select
                value={editingImage?.imageType || "Other"}
                onValueChange={(value) => setEditingImage({...editingImage, imageType: value})}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Action Shot">Action Shot</SelectItem>
                  <SelectItem value="Portrait">Portrait</SelectItem>
                  <SelectItem value="Team Photo">Team Photo</SelectItem>
                  <SelectItem value="Award/Achievement">Award/Achievement</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setEditingImage(null)}>
                Cancel
              </Button>
              <Button
                onClick={() => handleUpdateImage(editingImage.id, {
                  caption: editingImage.caption,
                  imageType: editingImage.imageType
                })}
                className="bg-blue-900"
              >
                Save Changes
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}