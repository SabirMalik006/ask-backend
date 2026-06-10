const Contact = require('../models/Contact');

const createContact = async (req, res) => {
  try {
    const { name, email, phone, company, message } = req.body;
    
    const contact = await Contact.create({
      name,
      email,
      phone,
      company,
      message
    });

    res.status(201).json({
      success: true,
      message: 'Message sent successfully!',
      data: contact
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

const getContacts = async (req, res) => {
  try {
    const contacts = await Contact.find().sort({ createdAt: -1 });
    res.json({
      success: true,
      data: contacts
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

const updateContactStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const contact = await Contact.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );

    if (contact) {
      res.json({
        success: true,
        data: contact
      });
    } else {
      res.status(404).json({
        success: false,
        message: 'Contact not found'
      });
    }
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

module.exports = {
  createContact,
  getContacts,
  updateContactStatus
};
