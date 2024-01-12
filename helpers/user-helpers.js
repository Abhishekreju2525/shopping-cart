var db = require("../config/connection");
var collection = require("../config/collections");
const { ObjectId } = require("mongodb");
const Razorpay = require("razorpay");
var instance = new Razorpay({
    key_id: "rzp_test_TXt26IVau0xOmj",
    key_secret: "mZL3Ja93muhNDRlNUZIrdOqF",
});
const bcrypt = require("bcrypt");
const { response } = require("express");
const { log } = require("node:console");
module.exports = {
    doSignup: (userData) => {
        return new Promise(async(resolve, reject) => {
            userData.password = await bcrypt.hash(userData.password, 10);
            db.get()
                .collection(collection.USER_COLLECTION)
                .insertOne(userData)
                .then((data) => {
                    resolve(data);
                });
        });
    },
    doLogin: (userData) => {
        return new Promise(async(resolve, reject) => {
            let loginStatus = false;
            let response = {};
            let user = await db
                .get()
                .collection(collection.USER_COLLECTION)
                .findOne({ email: userData.email });
            if (user) {
                bcrypt.compare(userData.password, user.password).then((status) => {
                    if (status) {
                        console.log("Success login");
                        response.user = user;
                        response.status = true;
                        resolve(response);
                    } else {
                        console.log("login failed");
                        resolve({ status: false });
                    }
                });
            } else {
                console.log("Login failed");
                resolve({ status: false });
            }
        });
    },
    addToCart: (proId, userId) => {
        let proObj = {
            item: new ObjectId(proId),
            quantity: 1,
        };
        return new Promise(async(resolve, reject) => {
            let userCart = await db
                .get()
                .collection(collection.CART_COLLECTION)
                .findOne({ user: new ObjectId(userId) });
            if (userCart) {
                let proExist = userCart.products.findIndex(
                    (product) => product.item == proId
                );
                // console.log(proExist);
                if (proExist != -1) {
                    db.get()
                        .collection(collection.CART_COLLECTION)
                        .updateOne({
                            user: new ObjectId(userId),
                            "products.item": new ObjectId(proId),
                        }, {
                            $inc: { "products.$.quantity": 1 },
                        })
                        .then(() => {
                            resolve();
                        });
                } else {
                    db.get()
                        .collection(collection.CART_COLLECTION)
                        .updateOne({ user: new ObjectId(userId) }, {
                            $push: { products: proObj },
                        })
                        .then((response) => {
                            resolve();
                        });
                }
            } else {
                let cartObj = {
                    user: new ObjectId(userId),
                    products: [proObj],
                };
                db.get()
                    .collection(collection.CART_COLLECTION)
                    .insertOne(cartObj)
                    .then((response) => {
                        resolve();
                    });
            }
        });
    },
    getCartProducts: (userId) => {
        return new Promise(async(resolve, reject) => {
            let cartItems = await db
                .get()
                .collection(collection.CART_COLLECTION)
                .aggregate([{
                        $match: { user: new ObjectId(userId) },
                    },
                    { $unwind: "$products" },
                    {
                        $project: {
                            item: "$products.item",
                            quantity: "$products.quantity",
                        },
                    },
                    {
                        $lookup: {
                            from: collection.PRODUCT_COLLECTION,
                            localField: "item",
                            foreignField: "_id",
                            as: "product",
                        },
                    },
                    {
                        $project: {
                            item: 1,
                            quantity: 1,
                            product: { $arrayElemAt: ["$product", 0] },
                        },
                    },
                ])
                .toArray();
            // console.log(cartItems[0].products);
            resolve(cartItems);
        });
    },
    getCartCount: (userId) => {
        return new Promise(async(resolve, reject) => {
            let count = 0;
            let cart = await db
                .get()
                .collection(collection.CART_COLLECTION)
                .findOne({ user: new ObjectId(userId) });
            if (cart) {
                count = cart.products.length;
            }
            resolve(count);
        });
    },
    changeProductQuantity: (details) => {
        details.count = parseInt(details.count);
        return new Promise((resolve, reject) => {
            db.get()
                .collection(collection.CART_COLLECTION)
                .updateOne({
                    _id: new ObjectId(details.cart),
                    "products.item": new ObjectId(details.product),
                }, {
                    $inc: { "products.$.quantity": details.count },
                })
                .then((response) => {
                    resolve(response);
                });
        });
    },

    deleteCartProduct: (details) => {
        return new Promise((resolve, reject) => {
            db.get()
                .collection(collection.CART_COLLECTION)
                .updateOne({
                    _id: new ObjectId(details.cart),
                }, {
                    $pull: {
                        products: { item: new ObjectId(details.product) },
                    },
                })
                .then((response) => {
                    resolve(response);
                });
        });
    },
    getTotalAmount: (userId) => {
        return new Promise(async(resolve, reject) => {
            let total = await db
                .get()
                .collection(collection.CART_COLLECTION)
                .aggregate([{
                        $match: { user: new ObjectId(userId) },
                    },
                    { $unwind: "$products" },
                    {
                        $project: {
                            item: "$products.item",
                            quantity: "$products.quantity",
                        },
                    },
                    {
                        $lookup: {
                            from: collection.PRODUCT_COLLECTION,
                            localField: "item",
                            foreignField: "_id",
                            as: "product",
                        },
                    },
                    {
                        $project: {
                            item: 1,
                            quantity: 1,
                            product: { $arrayElemAt: ["$product", 0] },
                        },
                    },
                    {
                        $group: {
                            _id: null,
                            total: {
                                $sum: {
                                    $multiply: ["$quantity", { $toInt: "$product.offerPrice" }],
                                },
                            },
                        },
                    },
                ])
                .toArray();
            // console.log(total[0].total);
            // console.log(cartItems[0].products);
            resolve(total[0].total);
        });
    },
    getTotalMRP: (userId) => {
        return new Promise(async(resolve, reject) => {
            let total = await db
                .get()
                .collection(collection.CART_COLLECTION)
                .aggregate([{
                        $match: { user: new ObjectId(userId) },
                    },
                    { $unwind: "$products" },
                    {
                        $project: {
                            item: "$products.item",
                            quantity: "$products.quantity",
                        },
                    },
                    {
                        $lookup: {
                            from: collection.PRODUCT_COLLECTION,
                            localField: "item",
                            foreignField: "_id",
                            as: "product",
                        },
                    },
                    {
                        $project: {
                            item: 1,
                            quantity: 1,
                            product: { $arrayElemAt: ["$product", 0] },
                        },
                    },
                    {
                        $group: {
                            _id: null,
                            total: {
                                $sum: {
                                    $multiply: ["$quantity", { $toInt: "$product.price" }],
                                },
                            },
                        },
                    },
                ])
                .toArray();
            // console.log(total[0].total);
            // console.log(cartItems[0].products);
            resolve(total[0].total);
        });
    },

    placeOrder: (order, products, total) => {
        return new Promise((resolve, reject) => {
            console.log(order, products, total);
            let status = order.payment === "COD" ? "placed" : "pending";
            let orderObj = {
                deliveryDetails: order,
                userId: new ObjectId(order.userId),
                paymentMethod: order.payment,
                products: products,
                status: status,
                total: total,
                date: new Date(),
            };

            db.get()
                .collection(collection.ORDER_COLLECTION)
                .insertOne(orderObj)
                .then((response) => {
                    db.get()
                        .collection(collection.CART_COLLECTION)
                        .deleteOne({ user: new ObjectId(order.userId) });
                    resolve(response.insertedId);
                });
        });
    },
    getCartProductList: (userId) => {
        return new Promise(async(resolve, reject) => {
            let cart = await db
                .get()
                .collection(collection.CART_COLLECTION)
                .findOne({ user: new ObjectId(userId) });
            resolve(cart.products);
        });
    },

    getUserOrders: (userId) => {
        return new Promise(async(resolve, reject) => {
            let orderList = await db
                .get()
                .collection(collection.ORDER_COLLECTION)
                .aggregate([{
                        $match: { userId: new ObjectId(userId) },
                    },

                    { $unwind: "$products" },
                    {
                        $project: {
                            orderId: "$_id",
                            item: "$products.item",
                            quantity: "$products.quantity",
                            total: "$total",
                            paymentMethod: "$paymentMethod",
                            status: "$status",
                            date: "$date",
                            address: "$deliveryDetails"
                        },
                    },
                    {
                        $lookup: {
                            from: collection.PRODUCT_COLLECTION,
                            localField: "item",
                            foreignField: "_id",
                            as: "product",
                        },
                    },
                    {
                        $project: {
                            item: 1,
                            quantity: 1,
                            total: 1,
                            orderId: 1,
                            paymentMethod: 1,
                            status: 1,
                            date: 1,
                            address: 1,
                            product: { $arrayElemAt: ["$product", 0] },
                        },
                    },
                    {
                        $group: {
                            _id: "$orderId",
                            products: {
                                $push: {
                                    item: "$item",
                                    quantity: "$quantity",
                                    product: "$product",
                                },
                            },
                            total: { $first: "$total" },
                            paymentMethod: { $first: "$paymentMethod" },
                            status: { $first: "$status" },
                            date: { $first: "$date" },
                            address: { $first: "$address" }
                        },
                    },
                    {
                        // Sort by orderDate in descending order
                        $sort: { date: -1 },
                    },
                ])
                .toArray();
            // console.log(cartItems[0].products);
            resolve(orderList);
        });
    },

    generateRazorpay: (orderId, total) => {
        return new Promise((resolve, reject) => {
            var options = {
                amount: total * 100, // amount in the smallest currency unit
                currency: "INR",
                receipt: "" + orderId,
            };
            instance.orders.create(options, function(err, order) {
                if (err) {
                    console.log(err);
                } else {
                    console.log("new order", order);
                }
                resolve(order);
            });
        });
    },
    verifyPayment: (details) => {
        return new Promise((resolve, reject) => {
            const { createHmac } = require("node:crypto");
            let hmac = createHmac('sha256', 'mZL3Ja93muhNDRlNUZIrdOqF');
            hmac.update(details['payment[razorpay_order_id]'] + '|' + details['payment[razorpay_payment_id]']);
            hmac = hmac.digest('hex')
            if (hmac == details['payment[razorpay_signature]']) {
                resolve()
            } else {
                reject()
            }
        });
    },
    changePaymentStatus: (orderId) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.ORDER_COLLECTION).updateOne({ _id: new ObjectId(orderId) }, {
                $set: {
                    status: 'placed'
                }
            }).then(() => {
                resolve()
            })
        })
    },
    changePassword: (newPassObj, userObj) => {
        return new Promise((resolve, reject) => {
            console.log(newPassObj.currentPass);
            bcrypt.compare(newPassObj.currentPass, userObj.password).then(async(status) => {
                if (status) {
                    console.log("password matched");
                    response.status = true
                    updatedPass = await bcrypt.hash(newPassObj.newPass, 10);
                    db.get()
                        .collection(collection.USER_COLLECTION)
                        .updateOne({ _id: new ObjectId(userObj._id) }, {
                            $set: {
                                password: updatedPass
                            }
                        })
                        .then((response) => {
                            response.status = true
                            resolve(response);
                        });

                } else {
                    console.log("password doesnt match");
                    resolve({ status: false })
                }
            })

        })
    },
    updateProfileData: (updateData, userData) => {

        let updateKey = Object.keys(updateData)[0]
        let updateValue = updateData[updateKey]
        console.log(updateKey, updateValue)
        return new Promise(async(resolve, reject) => {
            const updateObject = {};
            updateObject[updateKey] = updateValue;
            await db.get().collection(collection.USER_COLLECTION).updateOne({ _id: new ObjectId(userData._id) }, {
                $set: updateObject
            }).then((response) => {
                // console.log(response)
                if (response.acknowledged) {
                    // If the update in the database was successful, update the session data
                    userData[updateKey] = updateValue;
                    resolve(userData)
                }

            })
        })

    },
    addUserAddress: (details, userObj) => {
        console.log(userObj);
        return new Promise((resolve, reject) => {
            db.get()
                .collection(collection.USER_COLLECTION)
                .updateOne({
                    _id: new ObjectId(userObj._id),
                }, {
                    $push: {
                        address: details,
                    },
                })
                .then((response) => {
                    resolve(response);
                });
        });
    },
    deleteAddress: (details) => {
        console.log("Address deletion details:", details.addrId);
        return new Promise((resolve, reject) => {
            db.get()
                .collection(collection.USER_COLLECTION)
                .updateOne({ "_id": new ObjectId(details.userId) }, {
                    $pull: {
                        address: {
                            addrId: details.addrId // Match the specific addrId value you want to delete
                        }
                    }
                })
                .then((response) => {
                    resolve(response);
                })
                .catch((error) => {
                    reject(error);
                });
        });
    },
};