var express = require("express");
var router = express.Router();

var productHelpers = require("../helpers/product-helpers");
var helpers = require('handlebars-helpers')();
var adminHelpers = require("../helpers/admin-helpers");
const { log } = require("handlebars");
const verifyAdminLogin = (req, res, next) => {
    if (req.session.admin) {
        next();
    } else {
        res.redirect("/admin/admin-login");
    }
};
router.get("/", verifyAdminLogin, function(req, res, next) {
    let adminInfo = req.session.admin;

    productHelpers.getAllProducts().then((products) => {
        res.render("admin/view-products", { admin: true, products, adminInfo });
    });



});


router.get("/admin-login", (req, res) => {
    if (req.session.admin) {
        res.redirect("/");
    } else {
        res.render("admin/admin-login", { "loginErr": req.session.adminLoginErr, admin: true });
        req.session.adminLoginErr = false;
    }

});
router.post("/admin-login", (req, res) => {
    adminHelpers.doLogin(req.body).then((response) => {
        if (response.status) {
            req.session.admin = response.admin;
            req.session.admin.loggedIn = true;
            res.redirect("/admin");
        } else {
            req.session.adminLoginErr = "Invalid username or password";
            res.redirect("/admin/admin-login");
        }
    });
});


router.get("/admin-logout", (req, res) => {
    req.session.admin = null
    res.redirect("/admin/");
});


router.get("/choose-category", verifyAdminLogin, function(req, res) {
    productHelpers.getAllCategories().then((category) => {
        // console.log(category);
        res.render("admin/choose-category", { admin: true, adminInfo: req.session.admin, category });
    });

});

router.get("/add-product/:id", verifyAdminLogin, function(req, res) {
    // console.log(req.params.id);
    productHelpers.getCategoryDetails(req.params.id).then((category) => {
        // console.log("Category details : ", category);
        res.render("admin/add-product", { admin: true, adminInfo: req.session.admin, category: category });
    });

});
router.post("/add-product", verifyAdminLogin, (req, res) => {
    // console.log(req.body);
    // console.log(req.files.image);
    productHelpers.addProduct(req.body, (id) => {
        let image = req.files.image;
        // console.log("id arrived " + id);
        image.mv("./public/product-images/" + id + ".jpg", (err, done) => {
            if (!err) {
                productHelpers.getAllCategories().then((category) => {
                    // console.log(category);
                    res.render("admin/choose-category", { admin: true, adminInfo: req.session.admin, category });
                });
            } else {
                console.log(err);
            }
        });
        productHelpers.addProductSpecs(req.body, id)
    });
});
router.get("/delete-product/:id", verifyAdminLogin, (req, res) => {
    productHelpers.deleteProduct(req.params.id).then((response) => {
        res.redirect("/admin");
    });
});

router.get("/edit-products/:id", verifyAdminLogin, async(req, res) => {
    let product = await productHelpers.getProductDetails(req.params.id);
    let category = await productHelpers.getAllCategories();
    let categoryDetails = await productHelpers.getCategoryDetailsWithName(product.category)
    console.log("got cat details", categoryDetails);
    // console.log(product);
    await productHelpers.getProductSpecs(req.params.id).then((prodSpecs) => {
        console.log("prodspecs ", prodSpecs);
        res.render("admin/edit-products", { categoryDetails, admin: true, product, adminInfo: req.session.admin, category, prodSpecs });
    })

});
router.post("/edit-products/:id", (req, res) => {
    productHelpers.updateProduct(req.params.id, req.body).then(() => {
        res.redirect("/admin");
        if (req.files.image) {
            let image = req.files.image
            image.mv("./public/product-images/" + req.params.id + ".jpg");
        }
        productHelpers.updateProductSpecs(req.body, req.params.id)
    });
});
router.get("/view-all-orders", verifyAdminLogin, async(req, res) => {
    await adminHelpers.getAllOrders().then(async(orders) => {

        // console.log(orders);
        res.render("admin/view-all-orders", { orders, admin: true, adminInfo: req.session.admin });


    });

});
router.get("/view-users", verifyAdminLogin, async(req, res) => {
    await adminHelpers.getAllUsers().then(async(orders) => {

        // console.log(orders);
        res.render("admin/view-users", { admin: true, orders, adminInfo: req.session.admin });


    });

});
router.get("/view-user-order/:id", verifyAdminLogin, async(req, res) => {
    try {
        const orders = await adminHelpers.getUserOrders(req.params.id);
        const userData = await adminHelpers.getUserData(req.params.id);

        res.render("admin/view-user-order", {
            admin: true,
            userData: userData,
            orders: orders,
            adminInfo: req.session.admin
        });
    } catch (error) {
        console.error("Error:", error);
        res.status(500).send("Internal Server Error");
    }
});
router.get("/product-category", verifyAdminLogin, function(req, res) {
    productHelpers.getAllCategories().then((category) => {
        res.render("admin/product-category", { admin: true, adminInfo: req.session.admin, category });
    });

});
router.get("/add-category", verifyAdminLogin, function(req, res) {
    res.render("admin/add-category", { admin: true, adminInfo: req.session.admin });
});
router.post("/add-category", (req, res) => {
    // console.log(req.body);
    // console.log(req.files.image);
    productHelpers.addCategory(req.body, (id) => {

        res.render("admin/add-category", { admin: true, adminInfo: req.session.admin });

    });
});
router.get("/edit-category/:id", verifyAdminLogin, async(req, res) => {
    let category = await productHelpers.getCategoryDetails(req.params.id);
    res.render("admin/edit-category", { admin: true, category, adminInfo: req.session.admin });
});
router.post("/edit-category/:id", verifyAdminLogin, (req, res) => {
    productHelpers.updateCategory(req.params.id, req.body).then(() => {
        res.redirect("/admin/product-category");
    });
});
router.post("/delete-category-specs", verifyAdminLogin, (req, res) => {
    // console.log("first", req.body);
    productHelpers.deleteCategorySpecs(req.body).then((response) => {
        // console.log(req.body);
        // console.log(response)
        res.json({ status: response.acknowledged })
    })
});
router.post("/add-category-specs", verifyAdminLogin, (req, res) => {
    // console.log("adding", req.body);
    productHelpers.addCategorySpecs(req.body).then((response) => {
        // console.log(req.body);
        // console.log(response)
        res.json({ status: response.acknowledged })
    })
});
router.post("/delete-category", verifyAdminLogin, (req, res) => {
    console.log("delete category", req.body);
    productHelpers.deleteCategory(req.body).then((response) => {
        res.json({ status: true })
    })
});

router.get("/promo-codes", verifyAdminLogin, (req, res) => {
    productHelpers.getAllCoupons().then((coupon) => {
        res.render("admin/view-promocodes", { admin: true, adminInfo: req.session.admin, coupon });
    });

});
router.post('/add-coupon', verifyAdminLogin, async(req, res) => {

    adminHelpers.addCoupon(req.body).then(async() => {

        res.redirect('/admin/promo-codes');
    });
    console.log(req.body);
});
router.post('/delete-coupon', verifyAdminLogin, async(req, res) => {
    console.log(req.body.couponId);
    adminHelpers.deleteCoupon(req.body).then(async() => {

        res.json({ status: true })
    });

});
module.exports = router;