import Support from "../models/supportModel.js";

// Create a new ticket (Public)
export const createTicket = async (req, res) => {
  try {
    const { name, email, phone, subject, message } = req.body;
    const ticket = await Support.create({ name, email, phone, subject, message });
    res.status(201).json({ message: "Message sent successfully!", ticket });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get all tickets (Admin)
export const getAllTickets = async (req, res) => {
  try {
    const tickets = await Support.find().sort({ createdAt: -1 });
    res.status(200).json({ tickets });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update ticket status (Admin)
export const updateTicketStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, priority } = req.body;
    const ticket = await Support.findByIdAndUpdate(id, { status, priority }, { new: true });
    res.status(200).json({ message: "Ticket updated!", ticket });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete ticket (Admin)
export const deleteTicket = async (req, res) => {
  try {
    await Support.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: "Ticket deleted successfully!" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
