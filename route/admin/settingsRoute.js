import express from "express";
import {storageUsage} from '../../controllers/adminController/settingsController.js';


const Settingsrouter = express.Router();

Settingsrouter.get("/storage",storageUsage);



export default Settingsrouter