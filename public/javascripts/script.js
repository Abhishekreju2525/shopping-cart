function addToCart(proId) {
    $.ajax({
        url: '/add-to-cart/' + proId,
        method: 'get',
        success: (response) => {
            if (response.status) {
                let count = $('#cart-count').html()
                count = parseInt(count) + 1
                $("#cart-count").html(count)
            } else {
                location.href = '/login'
            }
        }

    })
}

function changeQuantity(cartId, proId, count) {
    $.ajax({
        url: '/change-product-quantity',
        data: {
            cart: cartId,
            product: proId,
            count: count
        },
        method: 'post',
        success: (response) => {
            if (response.count) {
                let count = $("#" + response.product).html();
                count = parseInt(count) + response.count;
                $("#" + response.product).html(count)
                location.reload()
                if (count == 1) {
                    $("#" + "decBtn" + response.product).attr("disabled", true);
                } else {
                    $("#" + "decBtn" + response.product).attr("disabled", false);
                }
            }
        }
    })
}

function confirmAndDeleteCartProduct(cartId, proId) {
    // Display a confirmation dialog
    if (window.confirm("Are you sure you want to remove this item from the cart?")) {
        // If the user clicks OK, call the deleteCartProduct function
        deleteCartProduct(cartId, proId);
    } else {
        // If the user clicks Cancel, do nothing
        // You can add additional handling if needed
    }
}

function deleteCartProduct(cartId, proId) {
    $.ajax({
        url: '/delete-cart-product',
        data: {
            cart: cartId,
            product: proId,
        },
        method: 'post',
        success: (response) => {

            if (response.status) {
                location.reload();
            }
        }
    })
}

function confirmAndDeleteCategorySpecs(catId, specs) {
    // Display a confirmation dialog
    if (window.confirm("Are you sure you want to remove this specification?")) {
        // If the user clicks OK, call the deleteCartProduct function
        deleteCategorySpecs(catId, specs);
    }
}

function deleteCategorySpecs(catId, specs) {


    $.ajax({
        url: '/admin/delete-category-specs',
        data: {
            category: catId,
            specs: specs,
        },
        method: 'post',
        success: (response) => {

            if (response.status) {

                location.reload();
            }
            console.log(response.status)
        }
    })
}

function confirmAndDeleteCategory(catId) {
    console.log(catId)
    if (window.confirm("Are you sure you want to remove this Category?")) {
        deleteCategory(catId);
    } else {

    }
}

function deleteCategory(catId) {
    $.ajax({
        url: '/admin/delete-category',
        data: {
            catId: catId,
        },
        method: 'post',
        success: (response) => {
            if (response && response.status !== undefined) {
                if (response.status) {
                    location.reload();
                }
                console.log(response.status);
            } else {
                console.error('Invalid response from the server');
            }
        },
        error: (error) => {
            console.error('AJAX request failed', error);
        }
    });
}


function addNewCategorySpec(catId) {
    const newSpec = document.getElementById("newSpec").value;
    console.log(newSpec)
    if (!newSpec) {
        alert("Please enter a specification before adding.");
        return;
    }

    $.ajax({
        url: '/admin/add-category-specs',
        data: {
            category: catId,
            specs: newSpec,
        },
        method: 'post',
        success: (response) => {
            if (response.status) {
                // Clear the input field
                document.getElementById("newSpec").value = '';
                // Reload the page or update the specifications display
                location.reload();
            }
            console.log(response.status);
        }
    });
}

function passwordVisibilityToggle() {
    var elements = document.getElementsByClassName("passwordShowToggle");
    for (var i = 0; i < elements.length; i++) {
        if (elements[i].type === "password") {
            elements[i].type = "text";
        } else {
            elements[i].type = "password";
        }
    }
}

function confirmAndDeleteAddress(userId, addrId) {
    console.log(userId, addrId)
    if (window.confirm("Are you sure you want to remove this address?")) {
        deleteAddress(userId, addrId);
    } else {

    }
}

function deleteAddress(userId, addrId) {
    $.ajax({
        url: '/delete-address',
        data: {
            userId: userId,
            addrId: addrId,
        },
        method: 'post',
        success: (response) => {
            if (response && response.status !== undefined) {
                if (response.status) {
                    location.reload();
                }
                console.log(response.status);
            } else {
                console.error('Invalid response from the server');
            }
        },
        error: (error) => {
            console.error('AJAX request failed', error);
        }
    });
}

// delete coupons

function confirmAndDeleteCoupon(couponId) {
    console.log(couponId)
    if (window.confirm("Are you sure you want to remove this coupon?")) {
        deleteCoupon(couponId);
    } else {

    }
}

function deleteCoupon(couponId) {
    $.ajax({
        url: '/admin/delete-coupon',
        data: {
            couponId: couponId,
        },
        method: 'post',
        success: (response) => {
            if (response && response.status !== undefined) {
                if (response.status) {
                    location.reload();
                }
                console.log(response.status);
            } else {
                console.error('Invalid response from the server');
            }
        },
        error: (error) => {
            console.error('AJAX request failed', error);
        }
    });
}