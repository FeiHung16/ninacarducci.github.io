(function ($) {
  $.fn.mauGallery = function (options) {
    const opts = $.extend({}, $.fn.mauGallery.defaults, options); /* Fusion des options avec celle de l'utlisateur */
    const tagsCollection = [];

    return this.each(function () { /* On applique le plugin à chaque éléemnt gallery */
      const gallery = $(this);

      $.fn.mauGallery.methods.createRowWrapper(gallery); /* Création du wrapper de ligne */

      if (opts.lightBox) {
        $.fn.mauGallery.methods.createLightBox( /* On range le code HTML */
          gallery,
          opts.lightboxId,
          opts.navigation
        );
      }

      $.fn.mauGallery.listeners(opts);

      gallery.children(".gallery-item").each(function () {
        const $item = $(this);
        $.fn.mauGallery.methods.responsiveImageItem($item); /* Rend l'image responsive */
        $.fn.mauGallery.methods.moveItemInRowWrapper($item); /* Déplace l'élément dans le wrapper de ligne */
        $.fn.mauGallery.methods.wrapItemInColumn($item, opts.columns); /* Wrap l'élément dans une colonne */

        const tag = $item.data("gallery-tag"); /* Récupère la valeur de l'attribut data-gallery-tag */

        if (opts.showTags && tag !== undefined && !tagsCollection.includes(tag)) {
          tagsCollection.push(tag); /* Ajoute le tag à la collection s'il n'y est pas déjà */
        }
      });

      if (opts.showTags) {
        $.fn.mauGallery.methods.showItemTags(
          gallery,
          opts.tagsPosition,
          tagsCollection
        );
      }

      gallery.fadeIn(500);
    });
  };

  $.fn.mauGallery.defaults = {
    columns: 3,
    lightBox: true,
    lightboxId: null,
    showTags: true,
    tagsPosition: "bottom",
    navigation: true
  };

  $.fn.mauGallery.listeners = function (options) {
    $(".gallery-item").on("click", function () {
      if (options.lightBox && $(this).is("img")) {
        $.fn.mauGallery.methods.openLightBox($(this), options.lightboxId);
      }
    });

    $(".gallery").on("click", ".nav-link", $.fn.mauGallery.methods.filterByTag);
    $(".gallery").on("click", ".mg-prev", () =>
      $.fn.mauGallery.methods.prevImage(options.lightboxId)
    );
    $(".gallery").on("click", ".mg-next", () =>
      $.fn.mauGallery.methods.nextImage(options.lightboxId)
    );
  };

  $.fn.mauGallery.methods = {
    createRowWrapper(element) {
      if (!element.children().first().hasClass("row")) {
        element.append('<div class="gallery-items-row row"></div>');
      }
    },

    wrapItemInColumn(element, columns) {
      if (typeof columns === "number") {
        element.wrap(
          `<div class="item-column mb-4 col-${Math.ceil(12 / columns)}"></div>`
        );
      } else if (typeof columns === "object") {
        let columnClasses = "";
        if (columns.xs) columnClasses += ` col-${Math.ceil(12 / columns.xs)}`;
        if (columns.sm) columnClasses += ` col-sm-${Math.ceil(12 / columns.sm)}`;
        if (columns.md) columnClasses += ` col-md-${Math.ceil(12 / columns.md)}`;
        if (columns.lg) columnClasses += ` col-lg-${Math.ceil(12 / columns.lg)}`;
        if (columns.xl) columnClasses += ` col-xl-${Math.ceil(12 / columns.xl)}`;

        element.wrap(`<div class="item-column mb-4${columnClasses}"></div>`);
      } else {
        console.error(
          `Columns should be a number or an object. Got ${typeof columns}`
        );
      }
    },

    moveItemInRowWrapper(element) {
      element.appendTo(".gallery-items-row");
    },

    responsiveImageItem(element) {
      if (element.is("img")) {
        element.addClass("img-fluid");
      }
    },

    openLightBox(element, lightboxId) {
      const id = lightboxId || "galleryLightbox";
      $(`#${id}`).find(".lightboxImage").attr("src", element.attr("src"));
      $(`#${id}`).modal("toggle");
    },

    getImagesByTag(activeTag) {
      const images = [];
      $(".item-column").each(function () {
        const img = $(this).children("img");
        if (img.length) {
          if (activeTag === "all" || img.data("gallery-tag") === activeTag) {
            images.push(img);
          }
        }
      });
      return images;
    },

    prevImage() {
      const currentSrc = $(".lightboxImage").attr("src");
      const activeTag = $(".tags-bar span.active-tag").data("images-toggle");
      const images = $.fn.mauGallery.methods.getImagesByTag(activeTag);

      const index = images.findIndex(img => img.attr("src") === currentSrc);
      const prev = images[index - 1] || images[images.length - 1];
      $(".lightboxImage").attr("src", prev.attr("src"));
    },

    nextImage() {
      const currentSrc = $(".lightboxImage").attr("src");
      const activeTag = $(".tags-bar span.active-tag").data("images-toggle");
      const images = $.fn.mauGallery.methods.getImagesByTag(activeTag);

      const index = images.findIndex(img => img.attr("src") === currentSrc);
      const next = images[index + 1] || images[0];
      $(".lightboxImage").attr("src", next.attr("src"));
    },

    createLightBox(gallery, lightboxId, navigation) {
      const id = lightboxId || "galleryLightbox";
      gallery.append(`
        <div class="modal fade" id="${id}" tabindex="-1" role="dialog" aria-hidden="true">
          <div class="modal-dialog" role="document">
            <div class="modal-content">
              <div class="modal-body position-relative text-center">
                ${
                  navigation
                    ? '<div class="mg-prev" style="cursor:pointer;position:absolute;top:50%;left:-15px;background:white;">&lt;</div>'
                    : ""
                }
                <img class="lightboxImage img-fluid" alt="Image affichée dans la modale"/>
                ${
                  navigation
                    ? '<div class="mg-next" style="cursor:pointer;position:absolute;top:50%;right:-15px;background:white;">&gt;</div>'
                    : ""
                }
              </div>
            </div>
          </div>
        </div>`);
    },

    showItemTags(gallery, position, tags) {
      let tagItems = `
        <li class="nav-item">
          <span class="nav-link active active-tag" data-images-toggle="all">Tous</span>
        </li>`;

      $.each(tags, (_, value) => {
        tagItems += `
          <li class="nav-item">
            <span class="nav-link" data-images-toggle="${value}">${value}</span>
          </li>`;
      });

      const tagsRow = `<ul class="my-4 tags-bar nav nav-pills">${tagItems}</ul>`;

      if (position === "bottom") {
        gallery.append(tagsRow);
      } else if (position === "top") {
        gallery.prepend(tagsRow);
      } else {
        console.error(`Unknown tags position: ${position}`);
      }
    },

    filterByTag() {
      if ($(this).hasClass("active-tag")) return;

      $(".active.active-tag").removeClass("active active-tag");
      $(this).addClass("active-tag active");

      const tag = $(this).data("images-toggle");

      $(".gallery-item").each(function () {
        const parent = $(this).parents(".item-column");
        parent.hide();
        if (tag === "all" || $(this).data("gallery-tag") === tag) {
          parent.show(300);
        }
      });
    }
  };
})(jQuery); /* Déclaration du plugin qui est une fonction auto */

