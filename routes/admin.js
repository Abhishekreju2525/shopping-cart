var express = require("express");
var router = express.Router();
var productHelpers = require("../helpers/product-helpers");
/* GET users listing. */
router.get("/", function (req, res, next) {
  productHelpers.getAllProducts().then((products) => {
    console.log(products);
    res.render("admin/view-products", { admin: true, products });
  });
});
router.get("/add-product", function (req, res) {
  res.render("admin/add-product");
});
router.post("/add-product", (req, res) => {
  // console.log(req.body);
  // console.log(req.files.image);
  productHelpers.addProduct(req.body, (id) => {
    let image = req.files.image;
    console.log("id arrived" + id);
    image.mv("./public/product-images/" + id + ".jpg", (err, done) => {
      if (!err) {
        res.render("admin/add-product");
      } else {
        console.log(err);
      }
    });
  });
});
router.get("/delete-product/:id", (req, res) => {
  productHelpers.deleteProduct(proId).then((response) => {
    res.redirect("/admin");
  });
});
router.get("/edit-products/:id", async (req, res) => {
  let product = await productHelpers.getProductDetails(req.params.id);
  res.render("admin/edit-products", { product });
});
router.post("/edit-products/:id", (req, res) => {
  productHelpers.updateProduct(req.params.id, req.body).then(() => {
    res.redirect("/admin");
    if (req.files.image) {
      let image=req.files.image
      image.mv("./public/product-images/" + req.params.id + ".jpg");
    }
  });
});

module.exports = router;
