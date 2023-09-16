// Copyright (c) 2015, Frappe Technologies Pvt. Ltd. and Contributors
// MIT License. See license.txt
import FormTimeline from "./form_timeline";
frappe.ui.form.Footer = class FormFooter {
	constructor(opts) {
		$.extend(this, opts);
		this.make();
		this.make_comment_box();
		this.make_timeline();
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
	}
};
