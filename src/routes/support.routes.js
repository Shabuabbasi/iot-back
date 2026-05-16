import express from "express";
import { createTicket, getAllTickets, updateTicketStatus, deleteTicket } from "../controllers/supportController.js";

const router = express.Router();

router.post("/create", createTicket);
router.get("/all", getAllTickets);
router.patch("/update/:id", updateTicketStatus);
router.delete("/delete/:id", deleteTicket);

export default router;
