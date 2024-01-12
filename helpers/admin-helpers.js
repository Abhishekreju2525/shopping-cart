var db = require("../config/connection");
var collection = require("../config/collections");
const { ObjectId } = require("mongodb");
const bcrypt = require("bcrypt");
const { response } = require("express");
module.exports = {
    // doSignup: (adminData) => {
    //     return new Promise(async(resolve, reject) => {
    //         adminData.password = await bcrypt.hash(adminData.password, 10);
    //         db.get()
    //             .collection(collection.ADMIN_COLLECTION)
    //             .insertOne(adminData)
    //             .then((data) => {
    //                 resolve(data);
    //             });
    //     });
    // },
    doLogin: (adminData) => {
        return new Promise(async(resolve, reject) => {
            console.log(adminData);
            let loginStatus = false;
            let response = {};
            let admin = await db.get().collection(collection.ADMIN_COLLECTION).findOne({ email: adminData.email });
            if (admin) {
                bcrypt.compare(adminData.password, admin.password).then((status) => {
                    if (status) {
                        console.log("Success admin login");
                        response.admin = admin;
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

    getAllOrders: (userId) => {
        return new Promise(async(resolve, reject) => {
            let orderList = await db
                .get()
                .collection(collection.ORDER_COLLECTION)
                .aggregate([

                    { $unwind: "$products" },
                    {
                        $project: {
                            orderId: "$_id",
                            item: "$products.item",
                            quantity: "$products.quantity",
                            total: "$total",
                            userId: "$userId",
                            paymentMethod: "$paymentMethod",
                            status: "$status",
                            date: "$date",
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
                            userId: 1,
                            paymentMethod: 1,
                            status: 1,
                            date: 1,
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
                            userId: { $first: "$userId" },
                            paymentMethod: { $first: "$paymentMethod" },
                            status: { $first: "$status" },
                            date: { $first: "$date" },
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
    getAllUsers: () => {
        return new Promise(async(resolve, reject) => {
            let userList = await db.get().collection(collection.USER_COLLECTION).find({}).toArray()
                // console.log(userList);
            resolve(userList)

        })
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
                        },
                    },
                ])
                .toArray();
            // console.log(cartItems[0].products);
            resolve(orderList);
        });
    },
    getUserData: async(userId) => {
        try {
            const user = await db.get().collection(collection.USER_COLLECTION).findOne({ _id: new ObjectId(userId) });
            console.log(user);
            return user;
        } catch (error) {
            console.error("Error fetching user data:", error);
            throw error; // Re-throw the error to handle it at a higher level, if needed.
        }
    },
    addCoupon: async(coupon) => {
        return new Promise((resolve, reject) => {
            db.get()
                .collection(collection.COUPON_COLLECTION)
                .insertOne(coupon)
                .then(() => {
                    resolve();

                });
        })
    },
    deleteCoupon: (data) => {
        console.log("arrived at coupon helper", data.couponId);
        return new Promise((resolve, reject) => {
            db.get()
                .collection(collection.COUPON_COLLECTION)
                .deleteOne({ _id: new ObjectId(data.couponId) })
                .then((response) => {
                    resolve(response);
                });
        });
    },

};