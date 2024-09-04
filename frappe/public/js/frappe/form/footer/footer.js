// Copyright (c) 2015, Frappe Technologies Pvt. Ltd. and Contributors
// MIT License. See license.txt
import FormTimeline from "./form_timeline";
frappe.ui.form.Footer = class FormFooter {
	constructor(opts) {
		$.extend(this, opts);
		this.make();
		this.make_comment_box();
		this.make_timeline();
		this.make_like();
		// render-complete
		$(this.frm.wrapper).on("render_complete", () => {
			this.refresh();
		});
	}
	make() {
		this.wrapper = $(frappe.render_template("form_footer", {})).appendTo(this.parent);
		this.wrapper.find(".btn-save").click(() => {
			this.frm.save("Save", null, this);
		});
	}
	make_comment_box() {
		let comment_box = this.wrapper.find(".comment-box");
		this.frm.comment_box = frappe.ui.form.make_control({
			parent: comment_box,
			render_input: true,
			only_input: true,
			enable_mentions: true,
			df: {
				fieldtype: "Comment",
				fieldname: "comment",
			},
			on_submit: (comment) => {
				if (strip_html(comment).trim() != "" || comment.includes("img")) {
					this.frm.comment_box.disable();
					let reply_for = comment_box.find(".reply-for[data-comment]");
					let reply_for_name = reply_for ? reply_for.attr("data-comment") : "";
					let is_nested_comment = reply_for.length > 0 && reply_for_name;
					frappe
						.xcall("frappe.desk.form.utils.add_comment", {
							reference_doctype: is_nested_comment ? "Comment" : this.frm.doctype,
							reference_name: is_nested_comment ? reply_for_name : this.frm.docname,
							content: comment,
							comment_email: frappe.session.user,
							comment_by: frappe.session.user_fullname,
						})
						.then((comment) => {
							let comment_item =
								this.frm.timeline.get_comment_timeline_item(comment);
							this.frm.comment_box.set_value("");
							frappe.utils.play_sound("click");
<<<<<<< HEAD
							if (is_nested_comment) {
								$(`.timeline-item[data-name="${reply_for_name}"]`).after(
									`<div class="timeline-item" data-doctype="Comment" data-name="${
										comment_item.name
									}">
										<div class="timeline-badge" title="SmallMessage">
											<svg class="icon  icon-md" style="">
												<use class="" href="#icon-small-message"></use>
											</svg>
										</div>
										<div class="timeline-content frappe-card" data-name="comment-${
											comment_item.name
										}" style="margin-left: 60px;">
											<div class="timeline-message-box">
												${comment_item.content.html()}
											</div>
										</div>
									</div>`
								);
							} else {
								this.frm.timeline.add_timeline_item(comment_item);
							}
							this.frm.sidebar.refresh_comments_count &&
								this.frm.sidebar.refresh_comments_count();
=======
							this.frm.timeline.add_timeline_item(comment_item);
							this.frm.get_docinfo().comments.push(comment);
							this.refresh_comments_count();
>>>>>>> upstream/develop
						})
						.finally(() => {
							this.frm.comment_box.enable();
							if (is_nested_comment) {
								reply_for.remove();
							}
						});
				}
			},
		});
	}
	make_timeline() {
		this.frm.timeline = new FormTimeline({
			parent: this.wrapper.find(".timeline"),
			frm: this.frm,
		});
	}
	refresh() {
		if (this.frm.doc.__islocal) {
			this.parent.addClass("hide");
		} else {
			this.parent.removeClass("hide");
			this.frm.timeline.refresh();
		}
		this.refresh_comments_count();
		this.refresh_like();
	}

	refresh_comments_count() {
		let count = (this.frm.get_docinfo().comments || []).length;
		this.wrapper.find(".comment-count")?.html(count ? `(${count})` : "");
	}

	make_like() {
		this.like_wrapper = this.wrapper.find(".liked-by");
		this.like_icon = this.wrapper.find(".liked-by .like-icon");
		this.like_count = this.wrapper.find(".liked-by .like-count");
		frappe.ui.setup_like_popover(this.wrapper.find(".form-stats-likes"), ".like-icon");

		this.like_icon.on("click", () => {
			frappe.ui.toggle_like(
				this.like_wrapper,
				this.frm.doctype,
				this.frm.doc.name,
				function () {
					this.refresh_like();
				}
			);
		});
	}

	refresh_like() {
		if (!this.like_icon) {
			return;
		}

		this.like_wrapper.attr("data-liked-by", this.frm.doc._liked_by);
		const liked = frappe.ui.is_liked(this.frm.doc);
		this.like_wrapper
			.toggleClass("not-liked", !liked)
			.toggleClass("liked", liked)
			.attr("data-doctype", this.frm.doctype)
			.attr("data-name", this.frm.doc.name);

		this.like_count && this.like_count.text(JSON.parse(this.frm.doc._liked_by || "[]").length);
	}
};
