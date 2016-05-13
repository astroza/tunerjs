var ffi = require('ffi');
var fs = require('fs');
var ref = require('ref');
var StructType = require('ref-struct');
var ArrayType = require('ref-array');

var v4l2_queryctrl = StructType({
	id: ref.types.uint32,
	type: ref.types.uint32,
	name: ArrayType(ref.types.uint8, 32),
	minimum: ref.types.uint32,
	maximum: ref.types.uint32,
	step: ref.types.int32,
	default_value: ref.types.int32,
	flags: ref.types.uint32,
	reserved: ArrayType(ref.types.uint32, 2)
});

var v4l2_tuner = StructType({
	index: ref.types.uint32,
	name: ArrayType(ref.types.uint8, 32),
	type: ref.types.uint32,
	capability: ref.types.uint32,
	rangelow: ref.types.uint32,
	rangehigh: ref.types.uint32,
	rxsubchans: ref.types.uint32,
	audmode: ref.types.uint32,
	signal: ref.types.int32,
	afc: ref.types.int32,
	reserved: ArrayType(ref.types.uint32, 4)
});

var tuner_struct = StructType({
	fd: ref.types.int,
	index: ref.types.int,
	volume_ctrl: v4l2_queryctrl,
	tuner: v4l2_tuner,
        test: ref.refType(ref.types.void)
});

function Tuner(device_number)
{
	this.tuner_struct = new tuner_struct;
	this.fmlib = ffi.Library('/usr/lib/tuner/fmlib.so', {
		'tuner_open': ['int', [ref.refType(tuner_struct), 'string', 'int'] ],
		'tuner_set_freq': ['int', [ref.refType(tuner_struct), ref.types.int64, 'int'] ],
		'tuner_set_volume': ['int', [ref.refType(tuner_struct), 'double'] ],
		'tuner_get_volume': ['int', [ref.refType(tuner_struct)] ],
		'tuner_get_signal': ['int', [ref.refType(tuner_struct)] ]
	});

	if(this.fmlib.tuner_open(this.tuner_struct.ref(), '/dev/radio' + device_number, 0) != 0)
		throw 'Radio device ' + device_number + 'not found';

	this.currentFreq = 0;
	this.setFrequency(87.5);
	return this;
}

Tuner.prototype.setFrequency = function(freq)
{
	if(this.fmlib.tuner_set_freq(this.tuner_struct.ref(), freq * 16000, 0) == 0) {
		this.currentFreq = freq;
		return 0;
	}
	return -1;
}

Tuner.prototype.setVolume = function(vol)
{
	if(this.fmlib.tuner_set_volume(this.tuner_struct.ref(), vol) != 0)
		return -1;
	return 0;
}

Tuner.prototype.getFrequency = function() 
{
	return this.currentFreq;
}

Tuner.prototype.getVolume = function()
{
	return this.fmlib.tuner_get_volume(this.tuner_struct.ref());
}

Tuner.prototype.getSignalQuality = function()
{
	return this.fmlib.tuner_get_signal(this.tuner_struct.ref());
}

module.exports = Tuner;
