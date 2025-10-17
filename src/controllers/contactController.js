const Contact = require('../models/Contact');

const contactController = {
  // Crear mensaje de contacto
  createContact: async (req, res) => {
    try {
      const { name, email, message } = req.body;

      // Validar campos
      if (!name || !email || !message) {
        return res.status(400).json({ 
          success: false, 
          message: 'Todos los campos son requeridos' 
        });
      }

      // Validar formato de email básico
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({ 
          success: false, 
          message: 'Email inválido' 
        });
      }

      // Crear contacto
      const newContact = await Contact.create({
        name,
        email,
        message
      });

      res.status(201).json({ 
        success: true, 
        message: 'Gracias por tu mensaje. Te contactaremos pronto.',
        contact: newContact
      });
    } catch (error) {
      console.error('Error al crear contacto:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Error al enviar mensaje de contacto' 
      });
    }
  },

  // Obtener todos los mensajes de contacto (admin)
  getAllContacts: async (req, res) => {
    try {
      const limit = parseInt(req.query.limit) || 100;
      const contacts = await Contact.findAll(limit);

      res.json({ 
        success: true, 
        count: contacts.length,
        contacts 
      });
    } catch (error) {
      console.error('Error al obtener contactos:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Error al obtener mensajes de contacto' 
      });
    }
  },

  // Obtener un mensaje por ID
  getContactById: async (req, res) => {
    try {
      const { id } = req.params;
      const contact = await Contact.findById(id);

      if (!contact) {
        return res.status(404).json({ 
          success: false, 
          message: 'Mensaje no encontrado' 
        });
      }

      res.json({ 
        success: true, 
        contact 
      });
    } catch (error) {
      console.error('Error al obtener contacto:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Error al obtener mensaje' 
      });
    }
  },

  // Eliminar mensaje de contacto
  deleteContact: async (req, res) => {
    try {
      const { id } = req.params;
      const deletedContact = await Contact.delete(id);

      if (!deletedContact) {
        return res.status(404).json({ 
          success: false, 
          message: 'Mensaje no encontrado' 
        });
      }

      res.json({ 
        success: true, 
        message: 'Mensaje eliminado exitosamente' 
      });
    } catch (error) {
      console.error('Error al eliminar contacto:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Error al eliminar mensaje' 
      });
    }
  }
};

module.exports = contactController;
