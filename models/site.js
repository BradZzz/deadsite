var mongoose = require('mongoose')

var siteSchema = new mongoose.Schema({
	cat: { type: String, required: true, index: true },
	url: {type: String},
	urlTitle: {type: String},
	title: {type: String},
	imgs: [{ type: mongoose.Schema.Types.Mixed },],
	created: { type: Date, default: Date.now },
	__v: { type: Number, select: false },
})

module.exports = mongoose.model('site', siteSchema)
