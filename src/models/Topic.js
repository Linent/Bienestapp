const mongoose = require("mongoose");

const topicSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true },
    filePath: { type: String, required: true },
    delete: { type: Boolean, default: false }, // Si el tema está eliminado o no
    description: { type: String, required: true },
    keywords: { type: [String], required: true }, // Palabras clave para la búsqueda
    publicId: { type: String, required: true }, // ID público de Cloudinary
  },
  { timestamps: true }
);

// Agrega el índice de texto para búsqueda
topicSchema.index({ name: 'text', description: 'text', keywords: 'text' });

module.exports = mongoose.models.Topic || mongoose.model("Topic", topicSchema);
