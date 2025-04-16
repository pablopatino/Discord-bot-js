require('dotenv').config();
const {REST, Routes, ApplicationCommandOptionType } = require('discord.js');

const commands = [
    {
        name: 'subasta',
        description: 'Replies',
        options: [
            {
                name: 'nombre_item',
                description: 'Nombre del item',
                type: ApplicationCommandOptionType.String,
                required: true
            }
        ]
    },
    {
        name: 'pujar',
        description: 'Pujar por un item',
        options: [
            {
                name: 'valor_a_pujar',
                description: 'Dks que quieras pujar',
                type: ApplicationCommandOptionType.Integer,
                required: true,
            },
            {
                name: 'id_de_la_subata',
                description: 'Id de la subata a la que vas a particiar',
                type: ApplicationCommandOptionType.Integer,
                required: true,
            }
        ]
    },
    {
        name: 'terminar',
        description: 'Termina la subasta',
        options: [
            {
                name: 'id_de_la_subata',
                description: 'Id de la subata que vas a finalizar',
                type: ApplicationCommandOptionType.Integer,
                required: true,
            },
        ]
    },
    {
        name: 'otorgar',
        description: 'Otorgar puntos a todos',
        options: [
            {
                name: 'puntos',
                description: 'Puntos a otorgarles a todos   ',
                type: ApplicationCommandOptionType.Integer,
                required: true,
            },
        ]
    },
    
];

const rest = new REST({ version: '10'}).setToken(process.env.TOKEN);

(async () => {
    try {
        console.log('Registro de commandos....')

        await rest.put(
            Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID),
            { body: commands }
        )
        
        console.log('Comandos exitoso....')

    } catch (error) {
        console.log(error);
    }
})();