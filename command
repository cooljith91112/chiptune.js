emcc wrapper.o player.o libmodplug.a -v -O0 -o modplug.js -s EXPORTED_FUNCTIONS="['_initialize_player', '_read_from_player', '_free_player']"

em++ wrapper/player.cpp wrapper/wrapper.cpp lib/libxmp.a -o libxmp.js -Iinclude -s EXPORTED_FUNCTIONS="['_initialize_player', '_read_from_player', '_free_player', '_free_buffer']"

