var db = require("../config/connection");
var collection = require("../config/collections");
const { ObjectId } = require("mongodb");
const { response } = require("express");
module.exports = {
  addProduct: (product, callback) => {
    console.log(product);
    db.get()
      .collection("product")
      .insertOne(product)
      .then((data) => {
        // console.log(data.insertedId);
        callback(data.insertedId.toString());
      });
  },

  getAllProducts: () => {
    return new Promise(async (resolve, reject) => {
      let products = await db
        .get()
        .collection(collection.PRODUCT_COLLECTION)
        .find()
        .toArray();
      resolve(products);
    });
  },

  deleteProduct:(prodId)=>{
    return new Promise((resolve,reject)=>{
      db.get().collection(collection.PRODUCT_COLLECTION).deleteOne({_id:new ObjectId(prodId)}).then((response)=>{
        resolve(response)
      })
    })

  },
  getProductDetails:(prodId)=>{
    return new Promise(async (resolve,reject)=>{
      let product= await db.get().collection(collection.PRODUCT_COLLECTION).findOne({_id:new ObjectId(prodId)}).then((product)=>{
        console.log(product);
        resolve(product)
      })
      
    })
  },
  updateProduct: (proID,productDetails) => {
    return new Promise((resolve,reject)=>{
      db.get().collection(collection.PRODUCT_COLLECTION).updateOne({_id:new ObjectId(proID)},{
        $set:{
          name:productDetails.name,
          description:productDetails.description,
          category:productDetails.category,
          price:productDetails.price
        }
      }).then((response)=>{
        resolve(response)
      })
    })
  },
};

