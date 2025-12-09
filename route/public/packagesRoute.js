
import express from 'express';
import {
  getAllCommonPackages,
  getCategoryPackages,

} from '../../controllers/publicController/packagesController.js';


const packagesRoute = express.Router();

packagesRoute.get('/common-packages', getAllCommonPackages);


packagesRoute.get('/category-packages', getCategoryPackages);



export default packagesRoute;
