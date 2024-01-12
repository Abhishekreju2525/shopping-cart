var express = require("express");
var router = express.Router();
var productHelpers = require("../helpers/product-helpers");
var userHelpers = require("../helpers/user-helpers");
const { prettify } = require("razorpay/dist/utils/razorpay-utils");
var helpers = require('handlebars-helpers')();
const verifyLogin = (req, res, next) => {
    if (req.session.user) {
        console.log(req.session.user.email);
        next();
    } else {
        res.redirect("/login");
    }
};
/* GET home page. */
router.get("/", async function(req, res, next) {
    let user = req.session.user;
    productHelpers.getAllProducts().then((products) => {
        // console.log(products);
        res.render("user/view-products", {
            title: "GadgetsZero - Online Electronics store",
            products,
            user,
            admin: false,
            category: res.locals.categoriesData
        });
    });
});
router.get("/get-product-api",async (req,res)=>{
    console.log("api call");
    productList=await productHelpers.getAllProducts()
    res.json(productList)
})
router.get("/login", (req, res) => {
    if (req.session.user) {
        res.redirect("/");
    }
    res.render("user/login", { "loginErr": req.session.userLoginErr });
    req.session.userLoginErr = false;
});
router.post("/login", (req, res) => {
    userHelpers.doLogin(req.body).then((response) => {
        if (response.status) {

            req.session.user = response.user;
            req.session.user.loggedIn = true;
            res.redirect("/");
        } else {
            req.session.userLoginErr = "Invalid username or password";
            res.redirect("/login");
        }
    });
});
router.get("/signup", (req, res) => {
    res.render("user/signup");
});
router.post("/signup", (req, res) => {
    userHelpers.doSignup(req.body).then((response) => {
        res.redirect("/login");
    });
});
router.get("/logout", (req, res) => {
    console.log(req.session.user);
    req.session.user = null
    res.redirect("/");
});
router.get("/cart", verifyLogin, async(req, res) => {
    await userHelpers.getCartProducts(req.session.user._id).then(async(products) => {
        let proQty = products.length;
        if (proQty > 0) {
            let total = await userHelpers.getTotalAmount(req.session.user._id)
            res.render("user/cart", { products, user: req.session.user, total });
        } else {
            res.render("user/cart", { products, user: req.session.user });
        }

    });

});

router.get("/add-to-cart/:id", verifyLogin, (req, res) => {
    console.log("entered add cart");
    // console.log("api call");
    userHelpers.addToCart(req.params.id, req.session.user._id).then(() => {
        // res.redirect("/");
        res.json({ status: true })
    });
});

router.post("/change-product-quantity", verifyLogin, (req, res) => {
    userHelpers.changeProductQuantity(req.body).then(() => {
        // console.log(req.body);
        res.json({ count: parseInt(req.body.count), product: req.body.product, index: req.body.index })
    })
})

router.post("/delete-cart-product", verifyLogin, (req, res) => {
    // console.log(req.body);
    userHelpers.deleteCartProduct(req.body).then((response) => {
        // console.log(req.body);
        // console.log(response)
        res.json({ status: response.acknowledged })
    })
})

router.get("/place-order", verifyLogin, async(req, res) => {

    let total = await userHelpers.getTotalAmount(req.session.user._id);
    let totalMRP = await userHelpers.getTotalMRP(req.session.user._id);
    let userjsonObj = await JSON.stringify(req.session.user);
    let cartProducts = await userHelpers.getCartProducts(req.session.user._id);
    let coupons = await productHelpers.getAllCoupons();
    let couponObj = await JSON.stringify(coupons);
    console.log(coupons);
    res.render("user/place-order", { user: req.session.user, total, userjsonObj, cartProducts, totalMRP, couponObj });
});

router.post("/place-order", verifyLogin, async(req, res) => {

    // console.log(req.body);
    let total = await userHelpers.getTotalAmount(req.body.userId)
    let products = await userHelpers.getCartProductList(req.body.userId)

    totalAmt = parseInt(req.body.totalUpdatedAmt)
    console.log(totalAmt);
    userHelpers.placeOrder(req.body, products, totalAmt).then((orderId) => {
        if (req.body['payment'] == 'COD') {
            res.json({ codSuccess: true })
        } else {
            userHelpers.generateRazorpay(orderId, totalAmt).then((response) => {
                res.json(response)
            })
        }
    })
});

router.get("/view-orders", verifyLogin, async(req, res) => {
    await userHelpers.getUserOrders(req.session.user._id).then(async(orders) => {

        // console.log(orders);
        res.render("user/view-orders", { orders, user: req.session.user });


    });

});
router.get("/order-success", verifyLogin, (req, res) => {
    res.render('user/order-success', { user: req.session.user })
})

router.post('/verify-payment', (req, res) => {
    console.log(req.body);
    userHelpers.verifyPayment(req.body).then(() => {
        userHelpers.changePaymentStatus(req.body['order[receipt]']).then(() => {
            console.log("payment success");
            res.json({ status: true })
        })
    }).catch((err) => {
        console.log(err);
        res.json({
            status: false,
            errMsg: ''
        })
    })
})
router.get('/product-page/:id', async(req, res) => {
    // console.log(req.params.id);
    await productHelpers.getProductDetails(req.params.id).then(async(prodData) => {
        // console.log(prodData);
        await productHelpers.getProductSpecs(req.params.id).then(async(prodSpecs) => {
            // console.log(prodSpecs);
            res.render('user/product-page', { prodData, prodSpecs, user: req.session.user })
        })

    })

})
router.get('/view-user-profile', verifyLogin, (req, res) => {
    // console.log(req.session.user.address);
    res.render('user/view-user-profile', { user: req.session.user })
})
router.get('/change-password', verifyLogin, (req, res) => {
    res.render("user/change-password", { user: req.session.user })
})
router.post('/change-password', async(req, res) => {
    let passErr = false
        // console.log(req.body);
        // console.log(req.session.user);
    await userHelpers.changePassword(req.body, req.session.user).then((response) => {
        if (response.status) {

            // console.log("password matched and ready to change", response.status);
            res.redirect("/view-user-profile");
        } else {
            // console.log("invalid current password");
            passErr = true
            res.render("user/change-password", { passErr });
        }

    })
})
router.get("/edit-profile", verifyLogin, (req, res) => {
    const key = req.query.key
        // console.log(key);
    res.render("user/edit-profile", { key, user: req.session.user })
})
router.post('/edit-profile', async(req, res) => {

    await userHelpers.updateProfileData(req.body, req.session.user).then((userData) => {

        // console.log(userData)
        req.session.user = userData
        res.render('user/view-user-profile', { user: req.session.user })
    })
})
router.get('/view-category', async(req, res) => {
    const category = req.query.category
        // console.log(category);
    await productHelpers.getProductsbyCategory(category).then((products) => {
        res.render('user/view-category', { user: req.session.user, category, products })
    })

})
router.get('/add-address', verifyLogin, (req, res) => {
    res.render('user/add-address', { user: req.session.user })
})
router.post('/add-address', verifyLogin, async(req, res) => {
    // console.log(req.session.user);
    await userHelpers.addUserAddress(req.body, req.session.user).then(() => {
        req.session.user.address.push(req.body);
        res.redirect('/view-user-profile')
    })
})
router.post("/delete-address", verifyLogin, (req, res) => {
    console.log("delete address", req.body);
    userHelpers.deleteAddress(req.body).then((response) => {
        req.session.user.address = req.session.user.address.filter((address) => address.addrId !== req.body.addrId);
        res.json({ status: true })
    })
});

module.exports = router;