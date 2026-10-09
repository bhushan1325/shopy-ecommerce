const API = "/api";

const params = new URLSearchParams(location.search);
const id = params.get("id");

let product = null;
let variants = [];
let selectedSize = null;
let selectedColor = null;

const $ = selector => document.querySelector(selector);

const money = value =>
  "₹" + Number(value || 0).toLocaleString("en-IN");

function token() {
  return (
    localStorage.getItem("token") ||
    sessionStorage.getItem("token") ||
    ""
  );
}

function toast(message) {
  const element = $("#toast");

  if (!element) return;

  element.textContent = message;
  element.classList.add("show");

  clearTimeout(window.__shopyToast);

  window.__shopyToast = setTimeout(() => {
    element.classList.remove("show");
  }, 2200);
}

function imgFallback(product) {
  return (
    product.imageUrl ||
    "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=1000&q=85"
  );
}


/* =========================
   PAGE START
========================= */

document.addEventListener("DOMContentLoaded", () => {
  setupHeader();
  setupSizeGuide();
  setupProductActions();
  load();
});


/* =========================
   HEADER
========================= */

function setupHeader() {

  const header =
    document.querySelector(".site-header");

  const menu = $("#menuBtn");
  const mobile = $("#mobileNav");

  const search = $("#searchBtn");
  const panel = $("#searchPanel");

  const scroll = () => {

    header?.classList.toggle(
      "scrolled",
      window.scrollY > 8
    );

  };

  scroll();

  window.addEventListener(
    "scroll",
    scroll,
    { passive:true }
  );

  menu?.addEventListener(
    "click",
    () => {
      const isOpen = mobile?.classList.toggle("open");
      menu.setAttribute("aria-expanded", String(Boolean(isOpen)));
    }
  );

  search?.addEventListener(
    "click",
    () => {
      const isOpen = panel?.classList.toggle("open");
      search.setAttribute("aria-expanded", String(Boolean(isOpen)));
      if (isOpen) {
        setTimeout(() => $("#searchInput")?.focus(), 50);
      }
    }
  );

  $("#searchForm")?.addEventListener("submit", event => {
    event.preventDefault();
    goSearch();
  });

  document
    .querySelectorAll("[data-q]")
    .forEach(button => {

      button.addEventListener(
        "click",
        () => {

          location.href =
            "/?search=" +
            encodeURIComponent(
              button.dataset.q
            );

        }
      );

    });

  $("#galleryWish")?.addEventListener(
    "click",
    () => {
      $("#wish")?.click();
    }
  );
}

function goSearch() {

  const input =
    $("#searchInput");

  if (!input) return;

  const query =
    input.value.trim();

  if (query) {

    location.href =
      "/?search=" +
      encodeURIComponent(query);

  }

}


/* =========================
   SIZE GUIDE
   FIXED
========================= */

function setupSizeGuide() {

  const modal =
    document.getElementById(
      "sizeModal"
    );

  if (!modal) {

    console.error(
      "SHOPY: sizeModal not found"
    );

    return;
  }


  function openGuide(event) {

    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }

    modal.classList.remove(
      "hidden"
    );

    modal.setAttribute(
      "aria-hidden",
      "false"
    );

    document.body.style.overflow =
      "hidden";

  }


  function closeGuide(event) {

    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }

    modal.classList.add(
      "hidden"
    );

    modal.setAttribute(
      "aria-hidden",
      "true"
    );

    document.body.style.overflow =
      "";

  }


  /*
     OPEN SIZE GUIDE
  */

  document.addEventListener(
    "click",
    event => {

      const target =
        event.target;


      if (
        target.closest(
          "#sizeGuide"
        )
      ) {

        openGuide(event);

        return;
      }


      /*
         CLOSE X
      */

      if (
        target.closest(
          "#closeModal"
        )
      ) {

        closeGuide(event);

        return;
      }


      /*
         CLOSE CANCEL
      */

      if (
        target.closest(
          "#cancelSizeGuide"
        )
      ) {

        closeGuide(event);

        return;
      }


      /*
         CLICK OUTSIDE MODAL CARD
      */

      if (
        target === modal
      ) {

        closeGuide(event);

        return;
      }

    }
  );


  /*
     ESCAPE KEY
  */

  document.addEventListener(
    "keydown",
    event => {

      if (
        event.key === "Escape" &&
        !modal.classList.contains(
          "hidden"
        )
      ) {

        closeGuide(event);

      }

    }
  );


  /*
     Stop clicks inside the white
     modal card.
  */

  const card =
    modal.querySelector(
      ".modal-card"
    );

  if (card) {

    card.addEventListener(
      "click",
      event => {
        event.stopPropagation();
      }
    );

  }

}


/* =========================
   PRODUCT ACTIONS
========================= */

function setupProductActions() {

  $("#addBag")?.addEventListener(
    "click",
    () => {
      addToBag(false);
    }
  );

  $("#buyNow")?.addEventListener(
    "click",
    () => {
      addToBag(true);
    }
  );

  $("#wish")?.addEventListener(
    "click",
    addWishlist
  );

}


/* =========================
   LOAD PRODUCT
========================= */

async function load() {

  if (!id) {

    showError(
      "No product selected."
    );

    return;
  }


  try {

    const response =
      await fetch(
        `${API}/products/${id}`
      );


    if (!response.ok) {

      throw new Error(
        "Product not found"
      );

    }


    product =
      await response.json();


    try {

      const variantResponse =
        await fetch(
          `${API}/product-variants/product/${id}`
        );


      if (variantResponse.ok) {

        variants =
          await variantResponse.json();

      }

    } catch {

      variants = [];

    }


    render();

    updateHeaderCounts();


  } catch (error) {

    console.error(error);

    showError(
      "We couldn't load this product."
    );

  }

}


/* =========================
   ERROR
========================= */

function showError(message) {

  const state =
    $("#productState");

  if (!state) return;

  state.textContent =
    message;

  state.classList.remove(
    "hidden"
  );

}


/* =========================
   RENDER PRODUCT
========================= */

function render() {

  $("#productState")
    ?.classList.add("hidden");


  $("#productView")
    ?.classList.remove("hidden");


  $("#crumbName").textContent =
    product.name ||
    "Product";


  $("#brand").textContent =
    product.brand ||
    "SHOPY";


  $("#name").textContent =
    product.name ||
    "";


  $("#description").textContent =
    product.description ||
    "Designed for modern everyday style.";


  $("#material").textContent =
    product.material ||
    "Premium fabric";


  $("#fit").textContent =
    product.fit ||
    "Regular";


  $("#style").textContent =
    product.style ||
    product.subcategory ||
    "Everyday";


  $("#availability").textContent =
    Number(product.stock || 0) > 0
      ? "In stock"
      : "Sold out";


  $("#rating").textContent =
    product.rating
      ? `★ ${Number(product.rating).toFixed(1)}`
      : "New";


  $("#reviews").textContent =
    `${product.reviewCount || 0} reviews`;


  $("#salePrice").textContent =
    money(
      product.salePrice ||
      product.price
    );


  $("#price").textContent =
    product.salePrice &&
    product.salePrice <
      product.price
      ? money(product.price)
      : "";


  if (
    product.salePrice &&
    product.price &&
    product.salePrice <
      product.price
  ) {

    $("#discount").textContent =
      Math.round(
        (
          1 -
          product.salePrice /
          product.price
        ) * 100
      ) + "% OFF";

  } else {

    $("#discount").textContent =
      "";

  }


  if (product.badge) {

    $("#badge").textContent =
      product.badge;

    $("#badge").classList.remove(
      "hidden"
    );

  }


  const image =
    $("#mainImage");


  if (image) {

    image.src =
      imgFallback(product);

    image.alt =
      product.name ||
      "SHOPY product";


    image.onerror =
      () => {

        image.src =
          "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=1000&q=85";

      };

  }


  renderGallery();

  renderOptions();


  $("#care").textContent =
    product.careInstructions ||
    "Follow the care label. Wash and store according to the garment instructions.";


  if (
    Number(product.stock || 0) <= 0
  ) {

    const addButton =
      $("#addBag");

    const buyButton =
      $("#buyNow");


    if (addButton) {

      addButton.disabled =
        true;

      addButton.textContent =
        "SOLD OUT";

    }


    if (buyButton) {

      buyButton.disabled =
        true;

    }

  }

}


/* =========================
   GALLERY
========================= */

function renderGallery() {
  const main = $("#mainImage");
  const thumbs = $("#thumbs");
  if (!main || !thumbs) return;

  const candidates = [
    product.imageUrl,
    product.imageUrl2,
    product.imageUrl3,
    product.image2,
    product.image3
  ].filter(Boolean);

  const images = [...new Set(candidates)];
  thumbs.innerHTML = "";

  if (!images.length) {
    return;
  }

  images.forEach((src, index) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "thumb-button";
    button.setAttribute("aria-label", `View product image ${index + 1}`);

    const image = document.createElement("img");
    image.className = "thumb";
    image.src = src;
    image.alt = `${product.name || "Product"} view ${index + 1}`;
    image.loading = index === 0 ? "eager" : "lazy";

    if (index === 0) image.classList.add("active");

    button.appendChild(image);
    button.addEventListener("click", () => {
      main.src = src;
      thumbs.querySelectorAll(".thumb").forEach(item => item.classList.remove("active"));
      image.classList.add("active");
    });
    thumbs.appendChild(button);
  });
}


/* =========================
   SIZE + COLOR OPTIONS
========================= */

function renderOptions() {

  const sizes =
    variants.filter(
      variant =>
        (variant.variantName || "")
          .toLowerCase() ===
        "size"
    );


  const colors =
    variants.filter(
      variant =>
        (variant.variantName || "")
          .toLowerCase() ===
        "color"
    );


  const unique =
    array => [

      ...new Map(
        array.map(item => [
          item.value,
          item
        ])
      ).values()

    ];


  const sizesContainer =
    $("#sizes");


  if (sizesContainer) {

    sizesContainer.innerHTML =
      "";


    unique(sizes)
      .forEach(
        variant => {

          const button =
            document.createElement(
              "button"
            );


          button.type =
            "button";

          button.className =
            "size-btn";

          button.textContent =
            variant.value;


          button.disabled =
            Number(
              variant.stock || 0
            ) <= 0;


          button.addEventListener(
            "click",
            () => {

              selectedSize =
                variant.value;


              document
                .querySelectorAll(
                  ".size-btn"
                )
                .forEach(
                  item =>
                    item.classList
                      .remove(
                        "selected"
                      )
                );


              button.classList.add(
                "selected"
              );

            }
          );


          sizesContainer
            .appendChild(
              button
            );

        }
      );


    if (!sizes.length) {

      sizesContainer.innerHTML =
        '<span style="font-size:13px;color:#777">One size</span>';

    }

  }


  const colorsContainer =
    $("#colors");


  if (colorsContainer) {

    colorsContainer.innerHTML =
      "";


    unique(colors)
      .forEach(
        variant => {

          const button =
            document.createElement(
              "button"
            );


          button.type =
            "button";

          button.className =
            "color-btn";


          button.title =
            variant.value;


          button.setAttribute(
            "aria-label",
            variant.value
          );


          button.style.background =
            colorMap(
              variant.value
            );


          button.addEventListener(
            "click",
            () => {

              selectedColor =
                variant.value;


              document
                .querySelectorAll(
                  ".color-btn"
                )
                .forEach(
                  item =>
                    item.classList
                      .remove(
                        "selected"
                      )
                );


              button.classList.add(
                "selected"
              );


              const selected =
                $("#selectedColor");


              if (selected) {

                selected.textContent =
                  variant.value;

              }

            }
          );


          colorsContainer
            .appendChild(
              button
            );

        }
      );


    if (!colors.length) {

      $("#selectedColor")
        .textContent = "—";

    }

  }

}


/* =========================
   COLOR MAP
========================= */

function colorMap(value) {

  const color =
    (value || "")
      .toLowerCase();


  const colors = {

    black:"#111",
    white:"#fff",
    navy:"#26334b",
    blue:"#4169a1",
    beige:"#d8c5a6",
    brown:"#795548",
    pink:"#e6a1b1",
    green:"#5f765e",
    grey:"#aaa",
    gray:"#aaa",
    cream:"#eee2c8",
    gold:"#c9a227",
    tan:"#b98252",
    khaki:"#9c956b",

    floral:
      "linear-gradient(135deg,#f6c1c1,#d5e3bc,#c2d5ed)",

    indigo:"#43517c"

  };


  return (
    colors[color] ||
    "#ddd"
  );

}


/* =========================
   ADD TO BAG
========================= */

async function addToBag(
  buyNow = false
) {

  const currentToken =
    token();


  if (!currentToken) {

    toast(
      "Please login first"
    );


    setTimeout(
      () => {
        location.href =
          "/login.html";
      },
      700
    );


    return;
  }


  const body = {

    productId:
      Number(id),

    quantity:
      1

  };


  if (selectedSize) {

    body.size =
      selectedSize;

  }


  if (selectedColor) {

    body.color =
      selectedColor;

  }


  try {

    const response =
      await fetch(
        `${API}/cart/add`,
        {
          method:"POST",

          headers:{
            "Content-Type":
              "application/json",

            Authorization:
              `Bearer ${currentToken}`
          },

          body:
            JSON.stringify(body)
        }
      );


    if (!response.ok) {

      throw new Error();

    }


    toast(
      "Added to bag"
    );


    updateHeaderCounts();


    if (buyNow) {

      setTimeout(
        () => {

          location.href =
            "/cart.html";

        },
        500
      );

    }


  } catch (error) {

    console.error(error);

    toast(
      "Could not add this item"
    );

  }

}


/* =========================
   WISHLIST
========================= */

async function addWishlist() {

  const currentToken =
    token();


  if (!currentToken) {

    toast(
      "Please login first"
    );


    setTimeout(
      () => {

        location.href =
          "/login.html";

      },
      700
    );


    return;
  }


  try {

    const response =
      await fetch(
        `${API}/wishlist/${id}`,
        {
          method:"POST",

          headers:{
            Authorization:
              `Bearer ${currentToken}`
          }
        }
      );


    if (!response.ok) {

      throw new Error();

    }


    const wishButton =
      $("#wish");


    const galleryButton =
      $("#galleryWish");


    if (wishButton) {

      wishButton.textContent =
        "♥";

    }


    if (galleryButton) {

      galleryButton.textContent =
        "♥";

    }


    toast(
      "Added to wishlist"
    );


    updateHeaderCounts();


  } catch (error) {

    console.error(error);

    toast(
      "Could not update wishlist"
    );

  }

}


/* =========================
   HEADER COUNTS
========================= */

async function updateHeaderCounts() {

  const currentToken =
    token();


  if (!currentToken)
    return;


  if ($("#account")) {

    $("#account").href =
      "/profile.html";

  }


  try {

    const response =
      await fetch(
        `${API}/cart`,
        {
          headers:{
            Authorization:
              `Bearer ${currentToken}`
          }
        }
      );


    const data =
      response.ok
        ? await response.json()
        : {};


    const count =
      (data.items || [])
        .reduce(
          (total,item) =>
            total +
            Number(
              item.quantity || 0
            ),
          0
        );


    if ($("#cartCount")) {

      $("#cartCount").textContent =
        count;

    }


  } catch (error) {

    console.error(error);

  }


  try {

    const response =
      await fetch(
        `${API}/wishlist`,
        {
          headers:{
            Authorization:
              `Bearer ${currentToken}`
          }
        }
      );


    const data =
      response.ok
        ? await response.json()
        : [];


    const items =
      Array.isArray(data)
        ? data
        : data.items || [];


    if ($("#wishCount")) {

      $("#wishCount").textContent =
        items.length;

    }


  } catch (error) {

    console.error(error);

  }

}