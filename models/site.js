var mongoose = require('mongoose')

var siteSchema = new mongoose.Schema({
	cat: { type: String, required: true, index: true },
	url: {type: String},
	urlTitle: {type: String},
	title: {type: String},

	h1: [{ type: mongoose.Schema.Types.Mixed },],
	h2: [{ type: mongoose.Schema.Types.Mixed },],
	h3: [{ type: mongoose.Schema.Types.Mixed },],
	h4: [{ type: mongoose.Schema.Types.Mixed },],
	span: [{ type: mongoose.Schema.Types.Mixed },],
	p: [{ type: mongoose.Schema.Types.Mixed },],

	imgs: [{ type: mongoose.Schema.Types.Mixed },],
	vids: [{ type: mongoose.Schema.Types.Mixed },],
	created: { type: Date, default: Date.now },
	__v: { type: Number, select: false },
})

module.exports = mongoose.model('site', siteSchema)
