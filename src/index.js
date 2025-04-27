require('dotenv').config();
const axios = require('axios');
const { Client, IntentsBitField, EmbedBuilder, InteractionResponse,ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');


const client = new Client({
    intents: [
        IntentsBitField.Flags.Guilds,
        IntentsBitField.Flags.GuildMembers,
        IntentsBitField.Flags.GuildMessages,
        IntentsBitField.Flags.MessageContent,
    ],
});

client.on('ready', (c) => {
    console.log('El bot esta listoo.');
});

//let idSubastaGlobal = null;
const subastas = new Map();
let core = null;
//let subastaTimeout = null;
//let hilo = null;


client.on('interactionCreate', async (interaction) => {
    if(!interaction.isChatInputCommand()) return;

    //console.log(interaction);
    //console.log(interaction.user.username);

    if(interaction.commandName === 'subasta'){
        const idDelItem = interaction.options.get('id_del_item').value;
        core = interaction.options.get('core').value;

        try {

            const response = await axios.post('http://localhost:8080/subasta/iniciar', {
                idDelItem: idDelItem,
                esParaCore: core
            });
            
            //idSubastaGlobal = response.data.idSubasta;
            const idSubasta = response.data.idSubasta;

            const nombreItem = response.data.nombreDelItem;
            const img = response.data.imgUrl;
            const armor = response.data.claseDelItem;
            const parteDelInventario = response.data.parteDelInventario

            console.log('*******************');
            console.log(img);


            const simboloCore = core ? '✅' : '❌';

            const embed = new EmbedBuilder()
            .setColor(0x0099FF) 
            .setTitle(nombreItem)
            .setThumbnail(img)
            .addFields(
                { name: 'Armor', value: armor, inline: true },
                { name: 'Tier', value: parteDelInventario, inline: true },
                { name: 'Core', value: simboloCore, inline: true },
            )

            await interaction.deferReply();

            await interaction.editReply({embeds: [embed]});

            const mensaje = await interaction.fetchReply();

            const hilo = await mensaje.startThread({
                name: `Subasta - ${nombreItem}`,
                autoArchiveDuration: 60,
                reason: 'Hilo creado para subasta'
            });

            subastas.set(hilo.id, {
                idSubasta,
                timeout: null,
                hilo
            });

            await hilo.send(`¡Comienza la subasta para **${nombreItem}**! Aquí irán las pujas.`);

        } catch (error) {
            console.error('Error al llamar al backend:', error);
            await interaction.reply('Error al consultar el backend.');
        }
    }

    if(interaction.commandName === 'pujar'){
        const valorAPujar = interaction.options.get('valor_a_pujar').value;
        const username = interaction.user.id;

        try {

            console.log(interaction);


            const threadId = interaction.channelId;
            const subasta = subastas.get(threadId);

            console.log('La id del threadId es ' + threadId);
            console.log('La subasta a la que se va a pujar es  ' + subasta.idSubasta);

            if (!subasta) {
                message.reply("No hay una subasta activa en este canal.");
                return;
            }
            

            const response = await axios.post('http://localhost:8080/subasta/pujar', {
                idSubasta: subasta.idSubasta,
                monto: valorAPujar,
                usuario: username
            });
            
            const embed = new EmbedBuilder()
            .setColor(0xFFD700) // dorado, estilo premio
            .setTitle('⚔️ Nueva Puja Realizada ⚔️')
            .setDescription(`¡Alguien más quiere el premio! ¿Vas a dejar que te ganen?`)
            .addFields(
                { name: '👤 Usuario', value: String(response.data), inline: true },
                { name: '💰 Monto Ofertado', value: `${valorAPujar} 🪙`, inline: true }
            )
            .setFooter({ text: '¡Apuesten mientras puedan!', iconURL: 'https://cdn-icons-png.flaticon.com/512/2838/2838912.png' })
            .setTimestamp();

            await interaction.reply({embeds: [embed] });

            if(subasta.timeout){
                clearTimeout(subasta.timeout);
            }

            const newTimeout = setTimeout(async () => {
                try {
                    const res = await axios.post(`http://localhost:8080/subasta/terminar/${subasta.idSubasta}`);
                    const finalEmbed = new EmbedBuilder()
                        .setColor(0x00C851)
                        .setTitle('🔒 ¡Subasta Finalizada!')
                        .setDescription('Han pasado 30 segundos sin nuevas pujas.')
                        .addFields(
                            { name: '👑 Ganador', value: `<@${res.data.nombreUsuario}>`, inline: true },
                            { name: '💰 Puja Ganadora', value: `${res.data.puntosUsados} 🪙`, inline: true }
                        );

                    console.log('Que es el hilo? ' + threadId);
            
                    if (subasta.hilo) {
                        await subasta.hilo.send({ embeds: [finalEmbed] });
                        await subasta.hilo.setLocked(true, 'Subasta finalizada');
                        await subasta.hilo.setArchived(true, 'Subasta finalizada');
                    }
            
                    subastas.delete(threadId); // Limpieza

                    const user = await client.users.fetch(username);
                    const message = await user.send(`🎉 Has ganado el item ${res.data.nombreDelItem}`);



                } catch (error) {
                    console.error('Error al finalizar subasta:', error);
                    if (hilo) await hilo.send('⚠️ Error al cerrar la subasta.');
                }
            }, 30 * 1000);
            
            subastas.set(threadId, {
                ...subasta,
                timeout: newTimeout
            });


        } catch (error) {
            console.error('Error al llamar al backend:', error);

            const embed = new EmbedBuilder()
            .setTitle(`❌Puja FALLIDA❌`)  
            .setDescription(`${error.response.data}`);

            await interaction.reply({
                embeds: [embed],
                flags: 64
            });
        }
    }

    if(interaction.commandName === 'terminar'){
        await finalizarSubasta(interaction, interaction.channel, idSubastaGlobal);
    }

    if(interaction.commandName === 'otorgar'){
        const OWNER_ID = '223175376820633603';

        if (interaction.user.id !== OWNER_ID) {
            return interaction.reply({
              content: '⛔ Este comando solo puede ser ejecutado por Patiño.',
              flags: 64
            });
          } 

        const puntos = interaction.options.get('puntos').value;

        try {
            const response = await axios.post(`http://localhost:8080/usuarios/otorgar/puntos/${puntos}`);
            console.log(response);

            const userIds  = response.data

            for (const userId of userIds) {
                try {
                    const user = await client.users.fetch(userId);
                    await user.send(`🎉 Has recibido ${puntos} puntos!`);

                    await interaction.reply({
                        content: '✅ Puntos otorgados.',
                        flags: 64
                    })
                } catch (error) {
                    console.error(`❌ No pude enviar mensaje a ${userId}:`, error);
                }
            }

            
        } catch (error) {
            console.error('Error al llamar al backend:', error);
            await interaction.reply('Error al consultar el backend.');
        }
    }

    if(interaction.commandName === 'registrarse'){
        const nombre = interaction.options.get('nombre').value;
        const id = interaction.user.id;
        const username = interaction.user.username;

        //console.log(id);

        try {
            const response = await axios.post('http://localhost:8080/usuarios/registrarse', {
                nombre: nombre,
                id: id,
                usernameDiscord: username
            });

            //console.log(response);

            const embed = new EmbedBuilder()
            .setTitle(`✅ Registro Exitoso ✅`)  
            .setDescription(`Ya puedes participar en las subastas`);

            await interaction.reply({
                    embeds: [embed],
                    flags: 64
                });

            
        } catch (error) {

            const embed = new EmbedBuilder()
            .setTitle(`❌Registro FALLIDO❌`)  
            .setDescription(`${error.response.data}`);

            await interaction.reply({
                    embeds: [embed],
                    flags: 64
                });
        }
    }

    if(interaction.commandName === 'loguearse'){
        const id = interaction.user.id;
        const username = interaction.user.username;

        //console.log(id);

        try {
            const response = await axios.post('http://localhost:8080/usuarios/loguerse', {
                id: id,
                usernameDiscord: username
            });

            const embed = new EmbedBuilder()
            .setTitle(`✅ Logueo Exitoso ✅`)  
            .setDescription(`Ya puedes recibir puntos en esta session`);

            await interaction.reply({
                    embeds: [embed],
                    flags: 64
                });

            
        } catch (error) {

            const embed = new EmbedBuilder()
            .setTitle(`❌Logueo FALLIDO❌`)  
            .setDescription(`${error.response.data}`);

            await interaction.reply({
                    embeds: [embed],
                    flags: 64
                });
        }
    }

    if(interaction.commandName === 'puntos'){
        const id = interaction.user.id;
        const username = interaction.user.username;

        //console.log(id);

        try {
            const response = await axios.get(`http://localhost:8080/usuarios/obtener/puntos/${id}`);
            const data = response.data;
            const embed = new EmbedBuilder()
            .setTitle(` Tus puntos actuales `)  
            .setDescription(`${data}`);

            await interaction.reply({
                    embeds: [embed],
                    flags: 64
                });

            
        } catch (error) {
            console.log(error);
        }
    }

    if(interaction.commandName === 'puntos_globales'){

        //console.log(id);

        try {
            const response = await axios.get(`http://localhost:8080/usuarios/puntos/lista`);
            const data = response.data;

        const lista = data.map((item, index) =>
            `**${index + 1}.** ${item.nombreDelUsuario} — ${item.puntosActuales} pts`
        ).join('\n');

        const embed = new EmbedBuilder()
            .setTitle('🏆 Ranking de puntos')
            .setDescription(lista)
            .setColor(0xFFD700);

        await interaction.reply({
            embeds: [embed],
 // o false si quieres que lo vean todos
        });

            
        } catch (error) {
            console.log(error);
        }
    }

    if(interaction.commandName === 'prueba'){

        revisarMensajesRaiderIO('651517792851329056');
    }

    if(interaction.commandName === 'registrar_personajes'){

        const nombre = interaction.options.get('nombre_del_personaje').value;
        const id = interaction.user.id;

        try {
        const response = await axios.post(`http://localhost:8080/usuarios/guardar/personaje/${id}/${nombre}`);

        const embed = new EmbedBuilder()
        .setTitle(`✅${response.data} ✅`)  
        .setDescription(`Ya puedes recibir puntos por hacer m+`);

        await interaction.reply({
                embeds: [embed],
                flags: 64
            });

        
    } catch (error) {

        const embed = new EmbedBuilder()
        .setTitle(`❌Registro FALLIDO❌`)  
        .setDescription(`${error.response.data}`);

        await interaction.reply({
                embeds: [embed],
                flags: 64
            });
    }
    }

    if(interaction.commandName === 'tradear_puntos'){

        const puntos = interaction.options.getInteger('puntos');
        const usuario = interaction.options.getUser('usuario'); 

        const userId = usuario.id;
        const recipient = await client.users.fetch(userId);

        const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId('accept_trade')
            .setLabel('✅ Aceptar')
            .setStyle(ButtonStyle.Success),
        new ButtonBuilder()
            .setCustomId('reject_trade')
            .setLabel('❌ Rechazar')
            .setStyle(ButtonStyle.Danger),
        );

        const dm = await recipient.send({
        content: `🎁 ¡Te están ofreciendo un trade de ${puntos} puntos de parte de <@${interaction.user.id}>!`,
        components: [row],
        });

        const collector = dm.createMessageComponentCollector({ time: 60_000 }); // 60s

        collector.on('collect', async i => {
        if (i.customId === 'accept_trade') {
            console.log('ACEPTO EL MARACAS')
            await i.reply({ content: '✅ Has aceptado el trade.', flags: 64 });
            collector.stop();
        } else if (i.customId === 'reject_trade') {
            console.log('CENCELO EL MARACAS')
            await i.reply({ content: '❌ Has rechazado el trade.', flags: 64 });
            collector.stop();
        }
        });

        collector.on('end', (_, reason) => {
        if (reason === 'time') {
            dm.edit({ content: '⏰ Trade expirado.', components: [] });
        }
        });

        interaction.reply('El tradeo se envio');
    }
});

async function finalizarSubasta(interaction, canal, idSubasta) {
    try {
        const response = await axios.post(`http://localhost:8080/subasta/terminar/${idSubasta}`);
        const ganador = response.data.nombreUsuario;
        const puntos = response.data.puntosUsados;

        const embedFinal = new EmbedBuilder()   
            .setColor(0x00C851)
            .setTitle('🔒 ¡Subasta Finalizada!')
            .setDescription('La subasta ha terminado.')
            .addFields(
                { name: '👑 Ganador', value: `<@${response.data.idUsuario}>`, inline: true },
                { name: '💰 Puja Ganadora', value: `${puntos} 🪙`, inline: true }
            )
            .setTimestamp();

        await canal.send({ embeds: [embedFinal] });

        if (canal.isThread() && !canal.locked) {
            await canal.setLocked(true, 'Subasta finalizada');
            await canal.setArchived(true, 'Subasta finalizada');
        }

    } catch (error) {
        console.error('Error al finalizar la subasta:', error);
        await canal.send('⚠️ Ocurrió un error al finalizar la subasta.');
    }
}


// ✅ Escucha mensajes nuevos (Raider.IO en tiempo real)
client.on('messageCreate', async (message) => {
    if (message.author.bot && message.author.username === 'Raider.IO') {
        console.log('📥 Nuevo mensaje de Raider.IO:');
        console.log(message);

        const participantes = procesarEmbed(embed, message.id);

        try {
            const response = await fetch('http://localhost:8080/usuarios/api/participantes', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(participantes),
            });

            if (!response.ok) {
                console.error('❌ Error al enviar datos al backend:', response.statusText);
            } else {
                console.log('✅ Datos enviados correctamente al backend.');
            }
        } catch (error) {
            console.error('❌ Error al hacer la petición al backend:', error);
        }
    }
});

function procesarEmbed(embed, mensajeId) {
    const participantes = [];

    const titulo = embed.data.title;
    const nivelMatch = titulo.match(/\+(\d+)/);
    const nivelDificultad = nivelMatch ? nivelMatch[0] : "Desconocido";

    const descripcion = embed.data.description;
    const regexNombres = /\[([^\]]+)\]\(https:\/\/raider.io\/characters\/[^\)]+\)/g;
    let match;
    while ((match = regexNombres.exec(descripcion)) !== null) {
        const nombreJugador = match[1];

        participantes.push({
            Nombre: nombreJugador,
            Participaciones: 1,
            Dificultades: [
                { Dificultad: nivelDificultad, Cantidad: 1 }
            ],
            Mensajes: [mensajeId]
        });
    }

    return participantes;
}

// ✅ Revisión diaria de mensajes (historico)
async function revisarMensajesRaiderIO(channelId) {
    const canal = await client.channels.fetch(channelId);
    const mensajes = await canal.messages.fetch({ limit: 10 });

    mensajes.forEach(msg => {
        if (msg.author.bot && msg.author.username === 'Raider.IO') {
            console.log('📜 Mensaje histórico de Raider.IO:');

            msg.embeds.forEach(embed => {
                registrarParticipaciones(embed,msg.id);
            });            
        }
    });

    const participantesArray = Object.values(participantes);

    console.log(JSON.stringify(participantesArray));

    try {
        const response = await axios.post(
            'http://localhost:8080/usuarios/api/participantes',
            participantesArray,  // Solo el BODY aquí, no necesitas JSON.stringify en axios
            {
                headers: {
                    'Content-Type': 'application/json'
                }
            }
        );
        
        Object.entries(response.data).forEach(([id, puntos]) => {
            enviarPuntosUsuario(id, puntos);
        });

        if (!response.ok) {
            console.error('Error al enviar los datos al backend:', response.statusText);
        } else {
            console.log('✅ Datos enviados al backend correctamente');
        }
    } catch (error) {
        console.error('❌ Error en la petición al backend:', error);
    }

}

function extraerDatos(embed) {
    const titulo = embed.data.title; 
    const nivel = titulo.match(/\+(\d+)/); // Buscar el patrón "+10", "+5", etc.
    const nivelDificultad = nivel ? nivel[0] : "Desconocido";

    const descripcion = embed.data.description;
    const nombres = [];
    const regexNombres = /\[([^\]]+)\]\(https:\/\/raider.io\/characters\/[^\)]+\)/g;
    let match;
    while ((match = regexNombres.exec(descripcion)) !== null) {
        nombres.push(match[1]); // match[1] contiene el nombre del jugador
    }

    return {
        nivelDificultad,
        nombres
    };
}

let participantes = {};

function registrarParticipaciones(embed,mensajeId) {
    const datos = extraerDatos(embed);

    // Iterar sobre los nombres de los participantes y registrar sus niveles de dificultad
    datos.nombres.forEach(nombre => {
        if (!participantes[nombre]) {
            // Si el jugador no existe, inicializamos su entrada
            participantes[nombre] = {
                Nombre: nombre,
                Participaciones: 0,
                Dificultades: [],
                Mensajes: []
            };
        }

        // Aumentamos el número de participaciones
        if (!participantes[nombre].Mensajes.includes(mensajeId)) {
            participantes[nombre].Participaciones++;
            participantes[nombre].Mensajes.push(mensajeId);

        // Verificamos si ya existe este nivel de dificultad para el jugador
            const dificultad = participantes[nombre].Dificultades.find(d => d.Dificultad === datos.nivelDificultad);

            if (dificultad) {
                // Si ya existe el nivel de dificultad, incrementamos la cantidad
                dificultad.Cantidad++;
            } else {
                // Si no existe, lo añadimos con cantidad 1
                participantes[nombre].Dificultades.push({
                    Dificultad: datos.nivelDificultad,
                    Cantidad: 1
                });
            }
        }
    });
}

async function enviarPuntosUsuario(userId, puntos) {
    try {
        const usuario = await client.users.fetch(userId);
        if (!usuario) {
            console.error('❌ No se pudo encontrar el usuario con ID:', userId);
            return;
        }

        const embed = new EmbedBuilder()
            .setColor('#00FF00')
            .setTitle('🏆 ¡Felicidades!')
            .setDescription(`Has ganado **${puntos} puntos**.`)
            .setTimestamp()
            .setFooter({ text: 'Sistema de Puntos | Raider.IO' });

        await usuario.send({ embeds: [embed] });

        console.log(`✅ Mensaje enviado a ${usuario.tag}`);
    } catch (error) {
        console.error('❌ Error al enviar el mensaje:', error);
    }
}




client.login(process.env.TOKEN);