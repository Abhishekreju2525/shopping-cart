var db = require("../config/connection");
var collection = require("../config/collections");
const { ObjectId } = require("mongodb");
const { response } = require("express");
const _ = require("lodash");
module.exports = {
    addProduct: (product, callback) => {
        mrPrice = parseInt(product.price);
        discount = parseInt(product.discount);

        //extracting core details from the object array
        // product = product.slice(0, 4);
        const startIndex = 0; // Index where you want to start
        const endIndex = 4; // Index where you want to end (inclusive)
        const keys = Object.keys(product);
        const selectedKeys = keys.slice(startIndex, endIndex + 1);
        const productDetails = _.pick(product, selectedKeys);
        productDetails.offerPrice = mrPrice - (discount / 100) * mrPrice;
        console.log(productDetails);
        db.get()
            .collection("product")
            .insertOne(productDetails)
            .then((data) => {
                // console.log(data.insertedId);
                callback(data.insertedId.toString());
            });
    },
    addProductSpecs: (product, id) => {
        // console.log("function specs success", product, "id", id);
        //extracting tech specs from the object array
        const specStartIndex = 5;
        const specKeys = Object.keys(product);
        const selectedSpecKeys = _.slice(specKeys, specStartIndex);
        const specData = _.pick(product, selectedSpecKeys);
        specData.prodId = id;
        console.log("spec extracted ", specData);
        db.get()
            .collection("product-specs")
            .insertOne(specData)
            .then((data) => {
                // console.log(data.insertedId);
            });
    },
    getProductSpecs: (prodId) => {
        return new Promise(async(resolve, reject) => {
            await db
                .get()
                .collection(collection.SPECS_COLLECTION)
                .findOne({ prodId: prodId })
                .then((response) => {
                    resolve(response);
                });
        });
    },
    getAllProducts: () => {
        return new Promise(async(resolve, reject) => {
            let products = await db
                .get()
                .collection(collection.PRODUCT_COLLECTION)
                .find()
                .toArray();
            resolve(products);
        });
    },

    deleteProduct: (prodId) => {
        return new Promise((resolve, reject) => {
            db.get()
                .collection(collection.PRODUCT_COLLECTION)
                .deleteOne({ _id: new ObjectId(prodId) })
                .then((response) => {
                    resolve(response);
                });
        });
    },
    getProductDetails: (prodId) => {
        return new Promise(async(resolve, reject) => {
            let product = await db
                .get()
                .collection(collection.PRODUCT_COLLECTION)
                .findOne({ _id: new ObjectId(prodId) })
                .then((product) => {
                    // console.log(product);
                    resolve(product);
                });
        });
    },
    updateProduct: (proID, productDetails) => {

        return new Promise((resolve, reject) => {
            const startIndex = 0; // Index where you want to start
            const endIndex = 4; // Index where you want to end (inclusive)
            const keys = Object.keys(productDetails);
            const selectedKeys = keys.slice(startIndex, endIndex + 1);
            const productUpdateDetails = _.pick(productDetails, selectedKeys);
            const updateObject = {};
            // Iterate through the keys in the productDetails object
            for (const key in productUpdateDetails) {
                if (key !== "_id") {
                    // Exclude the '_id' field
                    updateObject[key] = productUpdateDetails[key];
                }
            }
            if (
                updateObject.discount !== undefined &&
                updateObject.price !== undefined
            ) {
                updateObject.offerPrice =
                    updateObject.price -
                    (updateObject.discount / 100) * updateObject.price;
            }
            db.get()
                .collection(collection.PRODUCT_COLLECTION)
                .updateOne({ _id: new ObjectId(proID) }, { $set: updateObject })
                .then((response) => {
                    console.log("update response ", response);
                    resolve(response);
                });
        });
    },
    updateProductSpecs: (prodSpecs, id) => {
        return new Promise((resolve, reject) => {
            const specStartIndex = 5;
            const specKeys = Object.keys(prodSpecs);
            const selectedSpecKeys = _.slice(specKeys, specStartIndex);
            const specData = _.pick(prodSpecs, selectedSpecKeys);

            const updateSpecObject = {};
            // Iterate through the keys in the productDetails object
            for (const key in specData) {
                if (key !== "_id" && key !== "prodId") {
                    // Exclude the '_id' field
                    updateSpecObject[key] = specData[key];
                }
            }
            db.get()
                .collection(collection.SPECS_COLLECTION)
                .updateOne({ prodId: id }, { $set: updateSpecObject })
                .then((response) => {
                    console.log("update response ", response);
                    resolve(response);
                });
        });
    },
    getAllCategories: () => {
        return new Promise(async(resolve, reject) => {
            let category = await db
                .get()
                .collection(collection.CATEGORY_COLLECTION)
                .find()
                .toArray();
            resolve(category);
        });
    },
    getAllCoupons: () => {
        return new Promise(async(resolve, reject) => {
            let coupon = await db
                .get()
                .collection(collection.COUPON_COLLECTION)
                .find()
                .toArray();
            resolve(coupon);
        });
    },
    addCategory: (category, callback) => {
        // mrPrice = parseInt(product.price)
        // discount = parseInt(product.discount)
        // product.offerPrice = mrPrice - ((discount / 100) * mrPrice)

        console.log(category);
        db.get()
            .collection(collection.CATEGORY_COLLECTION)
            .insertOne(category)
            .then((data) => {
                // console.log(data.insertedId);
                callback(data.insertedId.toString());
            });
    },
    updateCategory: (catId, categoryDetails) => {
        return new Promise((resolve, reject) => {
            db.get()
                .collection(collection.CATEGORY_COLLECTION)
                .updateOne({ _id: new ObjectId(catId) }, {
                    $set: {
                        name: categoryDetails.name,
                    },
                })
                .then((response) => {
                    resolve(response);
                });
        });
    },
    getCategoryDetails: async(catId) => {
        try {
            const category = await db
                .get()
                .collection(collection.CATEGORY_COLLECTION)
                .findOne({ _id: new ObjectId(catId) });
            return category;
        } catch (error) {
            throw error;
        }
    },
    getCategoryDetailsWithName: async(catName) => {
        try {
            const category = await db
                .get()
                .collection(collection.CATEGORY_COLLECTION)
                .findOne({ name: catName });
            return category;
        } catch (error) {
            throw error;
        }
    },

    deleteCategorySpecs: (details) => {
        console.log("arrived at helpers", details);
        return new Promise((resolve, reject) => {
            db.get()
                .collection(collection.CATEGORY_COLLECTION)
                .updateOne({
                    _id: new ObjectId(details.category),
                }, {
                    $pull: {
                        specs: details.specs,
                    },
                })
                .then((response) => {
                    resolve(response);
                });
        });
    },

    deleteCategory: (details) => {
        console.log("arrived at helpers", details);
        return new Promise((resolve, reject) => {
            db.get()
                .collection(collection.CATEGORY_COLLECTION)
                .deleteOne({ _id: new ObjectId(details.catId) })
                .then((response) => {
                    resolve(response);
                });
        });
    },
    addCategorySpecs: (details) => {
        return new Promise((resolve, reject) => {
            db.get()
                .collection(collection.CATEGORY_COLLECTION)
                .updateOne({
                    _id: new ObjectId(details.category),
                }, {
                    $push: {
                        specs: details.specs,
                    },
                })
                .then((response) => {
                    resolve(response);
                });
        });
    },
    getProductsbyCategory: (category) => {
        return new Promise(async(resolve, reject) => {
            let products = await db
                .get()
                .collection(collection.PRODUCT_COLLECTION)
                .find({ "category": category })
                .toArray();
            // console.log(products);
            resolve(products);
        });
    },
};