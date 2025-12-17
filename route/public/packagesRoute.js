
import express from 'express';
import {
  getAllCommonPackages,
  getCategoryPackages,

} from '../../controllers/publicController/packagesController.js';


const packagesRoute = express.Router();

packagesRoute.get('/common-packages', getAllCommonPackages);


packagesRoute.get('/category-packages/:url', getCategoryPackages);



export default packagesRoute;
